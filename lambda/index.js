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
    const params = {
      cluster: this.clusterName(),
      services: ['rails']
    };
    return new Promise((resolve, reject) => {
      this.ecs.describeServices(params, (err, data) => {
        if (err) {
          reject(err);
          return;
        }

        const { services } = data;
        if (!services || services.length === 0) {
          reject(`No rails service in cluster ${this.clusterName()}`);
          return;
        }

        const service = services[0];
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
      this.s3.getObject(params, (err, data) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          const zip = new AdmZip(data.Body);
          const json = zip.readAsText('config/schedule.json');
          resolve(JSON.parse(json));
        } catch (e) {
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
      }
      this.events.putRule(params, (err, data) => {
        if (err) {
          reject(err);
          return;
        }

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
      }
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
      }

      this.events.putTargets(params, (err, data) => {
        if (err) {
          reject(err);
          return;
        }

        if (data['FailedEntryCount'] > 0) {
          reject(data['FailedEntries']);
          return;
        }

        resolve();
      })
    })
  }

  notifyJobSuccess() {
    return new Promise((resolve, reject) => {
      this.codepipeline.putJobSuccessResult({ jobId: this.job.id }, (err, data) => {
        if (err) reject(err);
        else resolve();
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
      this.codepipeline.putJobFailureResult(params, (err, data) => {
        resolve();
      })
    })
  }
}

exports.handler = function(event, context) {
  const job = event['CodePipeline.job'];
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
