const AWS = require('aws-sdk');
const AdmZip = require('adm-zip');

class Client {
  constructor(job) {
    this.ecs = new AWS.ECS();
    this.events = new AWS.CloudWatchEvents();
    this.codepipeline = new AWS.CodePipeline();
    this.s3 = new AWS.S3();
    this.job = job;
  }

  clusterName() {
    const { data: { actionConfiguration: { configuration } } } = this.job;
    return configuration['UserParameters']
  }

  getScheduledTaskTargetParams() {
    return new Promise((resolve, reject) => {
      const params = {
        cluster: this.clusterName(),
        services: ['rails']
      };
      console.log(`ECS.describeServices: ${params}`);
      this.ecs.describeServices(params, (err, data) => {
        if (err) {
          console.error(`Error on ECS.describeServices: ${err}`);
          reject(err);
          return;
        }

        const { services } = data;
        if (!services || services.length === 0) {
          console.error(`No rails service in cluster ${this.clusterName()}`);
          reject(`No rails service in cluster ${this.clusterName()}`);
          return;
        }

        const service = services[0];
        console.log(`ECS.describeServices: ${JSON.stringify(service)}`);

        const { clusterArn, platformVersion, taskDefinition, networkConfiguration: { awsvpcConfiguration } } = service;
        const { subnets, securityGroups } = awsvpcConfiguration;
        const eventsArn = process.env.EVENTS_ROLE;
        resolve({ clusterArn, platformVersion, taskDefinition, subnets, securityGroups, eventsArn });
      });
    });
  }

  schedulingTasks() {
    return new Promise((resolve, reject) => {
      const { bucketName, objectKey } = this.job.data.inputArtifacts[0].location.s3Location;
      const params = {
        Bucket: bucketName,
        Key: objectKey
      };
      console.log(`S3.getObject: ${params}`);
      this.s3.getObject(params, (err, data) => {
        if (err) {
          console.error(`Error on S3.getObject: ${err}`);
          reject(err);
          return;
        }

        console.log(`S3.getObject: ${data}`);
        try {
          const zip = new AdmZip(data.Body);
          const json = zip.readAsText('config/schedule.json');
          resolve(JSON.parse(json));
        } catch (e) {
          console.error(`unzip or JSON.parse: ${e}`);
          reject(e);
        }
      });
    });
  }

  putSchedulingTask(targetParams, task) {
    return this.putRule(task).then(() => this.putTarget(task, targetParams));
  }

  putRule(task) {
    return new Promise((resolve, reject) => {
      const params = {
        Name: task['name'],
        ScheduleExpression: `cron(${task['cron']})`,
        State: 'ENABLED'
      };
      console.log(`CloudWatchEvents.putRule: ${params}`);
      this.events.putRule(params, (err, data) => {
        if (err) {
          console.log(`Error on CloudWatchEvents.putRule: ${err}`);
          reject(err);
          return;
        }

        console.log(`CloudWatchEvents.putRule: ${JSON.stringify(data)}`);
        resolve(data['RuleArn']);
      })
    })
  }

  putTarget(task, targetParams) {
    return new Promise((resolve, reject) => {
      const input = {
        containerOverrides: [
          {
            name: this.clusterName(),
            command: ['bundle', 'exec', 'rake', task['task']]
          }
        ]
      };
      const params = {
        Rule: task['name'],
        Targets: [
          {
            Id: task['name'],
            Arn: targetParams['clusterArn'],
            RoleArn: targetParams['eventsArn'],
            Input: JSON.stringify(input),
            EcsParameters: {
              TaskDefinitionArn: targetParams['taskDefinition'],
              TaskCount: 1,
              LaunchType: 'FARGATE',
              NetworkConfiguration: {
                awsvpcConfiguration: {
                  AssignPublicIp: 'ENABLED',
                  SecurityGroups: targetParams['securityGroups'],
                  Subnets: targetParams['subnets'],
                }
              },
              PlatformVersion: targetParams['platformVersion']
            }
          }
        ]
      };

      console.log(`CloudWatchEvents.putTargets: ${params}`);
      this.events.putTargets(params, (err, data) => {
        if (err) {
          console.error(`Error on CloudWatchEvents.putTargets: ${err}`);
          reject(err);
          return;
        }

        if (data['FailedEntryCount'] > 0) {
          console.error(`CloudWatchEvents.putTargets: failed. ${JSON.stringify(data)}`);
          reject(data['FailedEntries']);
          return;
        }

        console.error('CloudWatchEvents.putTargets: done');
        resolve();
      })
    })
  }

  notifyJobSuccess() {
    return new Promise((resolve, reject) => {
      console.log(`CodePipeline.putJobSuccessResult: ${this.job.id}`);
      this.codepipeline.putJobSuccessResult({ jobId: this.job.id }, (err, data) => {
        if (err) {
          console.error(`Error on CodePipeline.putJobSuccessResult: ${err}`);
          reject(err);
        } else {
          console.log(`CodePipeline.putJobSuccessResult: ${JSON.stringify(data)}`);
          resolve();
        }
      })
    })
  }

  notifyJobFailure(contextId, err) {
    return new Promise((resolve, reject) => {
      const params = {
        jobId: this.job.id,
        failureDetails: {
          message: JSON.stringify(err),
          type: 'JobFailed',
          externalExecutionId: contextId
        }
      }
      console.log(`CodePipeline.putJobSuccessResult: ${params}`);
      this.codepipeline.putJobFailureResult(params, (err, data) => {
        console.log(`CodePipeline.putJobFailureResult: err=${err}, data=${JSON.stringify(data)}`);
        resolve();
      })
    })
  }
}

exports.handler = function(event, context) {
  const job = event['CodePipeline.job'];
  console.log(`CodePipeline job id: ${job.id}`);

  const client = new Client(job);
  Promise
    .all([client.getScheduledTaskTargetParams(), client.schedulingTasks()])
    .then(([targetParams, tasks]) =>
      Promise.all(tasks.map(task => client.putSchedulingTask(targetParams, task)))
    )
    .then(() => client.notifyJobSuccess()
                      .then(() => context.succeed('Done'))
                      .catch(err => context.fail(err)))
    .catch(err => client.notifyJobFailure(context.invokeid, err)
                        .then(() => context.fail(err)));
}
