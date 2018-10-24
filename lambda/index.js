const AWS = require('aws-sdk');

// ベタで ECS スケジュールタスクを作ってみる

// メモ
//   同名の rule があってもエラーにならない
//   同 ID の target があってもエラーにならず、更新してくれる
exports.handler = function(event, context) {
  const projectName = 'everydayrails'; // 本当は CodePipeline からパラメータで渡す

  const ecs = new AWS.ECS();

  const clusterName = projectName;
  const serviceParams = {
    cluster: clusterName,
    services: ['rails']
  };
  ecs.describeServices(serviceParams, (err, data) => {
    if (err) {
      context.failed(err);
      return;
    }

    const service = data['services'][0];
    const { clusterArn, platformVersion, taskDefinition, networkConfiguration: { awsvpcConfiguration } } = service;
    const { subnets, securityGroups } = awsvpcConfiguration;
    
    /* const launcherRoleArn = 'arn:aws:iam::826145371799:role/ecsEventsRole'; */

    console.log('clusterArn', clusterArn);
    console.log('platformVersion', platformVersion);
    console.log('taskDefinition', taskDefinition);
    console.log('subnets', subnets);
    console.log('securityGroups', securityGroups);
    context.succeed('done');

    /* { serviceArn: 'arn:aws:ecs:ap-northeast-1:826145371799:service/rails',
     *   serviceName: 'rails',
     *   clusterArn: 'arn:aws:ecs:ap-northeast-1:826145371799:cluster/everydayrails',
     *   loadBalancers: [],
     *   serviceRegistries: 
     *    [ { registryArn: 'arn:aws:servicediscovery:ap-northeast-1:826145371799:service/srv-rs5ive3xewd2azlg' } ],
     *   status: 'ACTIVE',
     *   desiredCount: 1,
     *   runningCount: 0,
     *   pendingCount: 0,
     *   launchType: 'FARGATE',
     *   platformVersion: 'LATEST',
     *   taskDefinition: 'arn:aws:ecs:ap-northeast-1:826145371799:task-definition/everydayrails:1',
     *   deploymentConfiguration: { maximumPercent: 200, minimumHealthyPercent: 100 },
     *   deployments: 
     *    [ { id: 'ecs-svc/9223370496490996860',
     *        status: 'PRIMARY',
     *        taskDefinition: 'arn:aws:ecs:ap-northeast-1:826145371799:task-definition/everydayrails:1',
     *        desiredCount: 1,
     *        pendingCount: 0,
     *        runningCount: 0,
     *        createdAt: 2018-10-24T06:49:38.946Z,
     *        updatedAt: 2018-10-24T06:49:38.946Z,
     *        launchType: 'FARGATE',
     *        platformVersion: '1.2.0',
     *        networkConfiguration: [Object] } ],
     *   roleArn: 'arn:aws:iam::826145371799:role/aws-service-role/ecs.amazonaws.com/AWSServiceRoleForECS',
     *   events: 
     *    [ { id: '550f7b48-1467-4279-adc6-bf90f44788a9',
     *        createdAt: 2018-10-24T06:52:30.421Z,
     *        message: '(service rails) has started 1 tasks: (task 7eb927ea-9f3e-4053-8af7-bb2e21aba7c1).' },
     *      { id: '445c2b10-50eb-4819-ba8d-0773e5657567',
     *        createdAt: 2018-10-24T06:49:44.764Z,
     *        message: '(service rails) has started 1 tasks: (task ea909a97-aef8-4f60-9c44-185281156fa8).' },
     *      { id: '1c1b2909-03f7-4a98-957a-96fe3c24dff9',
     *        createdAt: 2018-10-24T06:48:38.294Z,
     *        message: '(service rails) has started 1 tasks: (task 31165bfa-5dec-49de-a373-ab51a2b95536).' },
     *      { id: '2f0d45e0-4c46-48eb-a671-f416f2a97797',
     *        createdAt: 2018-10-24T06:45:22.152Z,
     *        message: '(service rails) has started 1 tasks: (task 0bde63d7-7a61-4e3e-839b-de4f671d3d82).' },
     *      { id: '168de5c8-c5c3-4063-9c32-29e65b3c4c8c',
     *        createdAt: 2018-10-24T06:42:40.181Z,
     *        message: '(service rails) has started 1 tasks: (task dd7015e9-75c7-424a-8414-aba05afb390a).' },
     *      { id: 'a68f8a79-d364-472a-9a30-9828e2ad43b1',
     *        createdAt: 2018-10-24T06:40:06.977Z,
     *        message: '(service rails) has started 1 tasks: (task 2e54a839-bcc4-45f6-934d-5ab37bd8f884).' },
     *      { id: '2ebb4c1d-647d-4d77-884f-9e4a68924080',
     *        createdAt: 2018-10-24T06:37:45.910Z,
     *        message: '(service rails) has started 1 tasks: (task ba9ac39b-8f1d-4e94-a899-d7ce174ce8ff).' },
     *      { id: '9f0365d3-306e-4b06-8971-9fb63921a754',
     *        createdAt: 2018-10-24T06:35:15.326Z,
     *        message: '(service rails) has started 1 tasks: (task 78b62191-46ba-41be-852c-300840fd17fd).' },
     *      { id: '1252a8db-b221-48d9-a3f3-05d56a924ebd',
     *        createdAt: 2018-10-24T06:32:35.389Z,
     *        message: '(service rails) has started 1 tasks: (task 99bd7fa2-0e7e-460f-b61d-faf5203350e4).' },
     *      { id: 'f14754d0-c11b-42f9-8d46-9c797a6db1ac',
     *        createdAt: 2018-10-24T06:30:02.805Z,
     *        message: '(service rails) has started 1 tasks: (task f4257532-fb63-4375-92a0-a2b13d9d7a6b).' },
     *      { id: '3fe876ba-7d9f-4adf-a8bc-3d6660024d39',
     *        createdAt: 2018-10-24T06:27:21.398Z,
     *        message: '(service rails) has started 1 tasks: (task 6b8f3eef-2447-424c-b3e0-062c49d240d2).' },
     *      { id: '9634d260-cd7f-4a53-a403-b6737483c5f7',
     *        createdAt: 2018-10-24T06:24:48.940Z,
     *        message: '(service rails) has started 1 tasks: (task b985c187-ee3e-4f1e-b252-3d53345d5f1b).' } ],
     *   createdAt: 2018-10-24T06:24:39.043Z,
     *   placementConstraints: [],
     *   placementStrategy: [],
     *   networkConfiguration: 
     *    { awsvpcConfiguration: 
     *       { subnets: [Array],
     *         securityGroups: [Array],
     *         assignPublicIp: 'ENABLED' } },
     *   schedulingStrategy: 'REPLICA' } */
    context.succeed('done');
  })
}

//  const events = new AWS.CloudWatchEvents();
//  // put-rule
//  const ruleParams = {
//    Name: 'STRING_VALUE', /* required */
//    /* Description: 'STRING_VALUE',
//     * EventPattern: 'STRING_VALUE',
//     * RoleArn: 'STRING_VALUE', */
//    ScheduleExpression: 'cron(0 20 * * ? *)',
//    State: 'ENABLED'
//  };
//  events.putRule(ruleParams, (err, data) => {
//    if (err) {
//      console.log(err, err.stack);
//      context.fail('failed');
//      return;
//    }
//
//    const clusterArn = 'arn:aws:ecs:ap-northeast-1:826145371799:cluster/everydayrails';
//    const launcherRoleArn = 'arn:aws:iam::826145371799:role/ecsEventsRole';
//    const input = {
//      containerOverrides: [
//        {
//          name: "everydayrails",
//          command: ["bundle", "exec", "rake", "cron:sample2"]
//        }
//      ]
//    }
//    const taskDefArn = 'arn:aws:ecs:ap-northeast-1:826145371799:task-definition/run-everydayrails:14';
//    const taskCount = 1;
//    const serviceSecurityGroup = 'sg-08d44aff88f94ca0c';
//    const clusterSubnets = ['subnet-0b4643dd6e5f4ce45', 'subnet-0503d848f83020ede'];
//    const targetParams = {
//      Rule: ruleParams['Name'],
//      Targets: [
//        {
//          Id: 'lambda-made-target',
//          Arn: clusterArn,
//          RoleArn: launcherRoleArn,
//          Input: JSON.stringify(input),
//          EcsParameters: {
//            TaskDefinitionArn: taskDefArn,
//            TaskCount: 1,
//            LaunchType: 'FARGATE',
//            NetworkConfiguration: {
//              awsvpcConfiguration: {
//                AssignPublicIp: 'ENABLED',
//                SecurityGroups: [serviceSecurityGroup],
//                Subnets: clusterSubnets,
//              }
//            },
//            PlatformVersion: 'LATEST'
//          }
//        }
//      ]
//    }
//    events.putTargets(targetParams, (err, data) => {
//      if (err) console.log(err, err.stack);
//      else console.log(data);
//      context.succeed('done');
//    })

//    events.listTargetsByRule({ Rule: 'hand-made-rule' }, (err, data) => {
//      if (err) {
//        console.log(err, err.stack);
//      } else {
//        /* { Targets: 
//           [ { Id: 'hand-made-target',
//         * Arn: 'arn:aws:ecs:ap-northeast-1:826145371799:cluster/everydayrails',
//         * RoleArn: 'arn:aws:iam::826145371799:role/ecsEventsRole',
//         * Input: '{"containerOverrides":[{"name":"everydayrails","command":["bundle","exec","rake","cron:sample2"]}]}',
//         * EcsParameters: { TaskDefinitionArn: 'arn:aws:ecs:ap-northeast-1:826145371799:task-definition/run-everydayrails:14',
//         *                  TaskCount: 1 } } ] } */
//
//        const target0 = data['Targets'][0];
//        console.log(target0);
//      }
//      context.succeed('done');
//    });
//  })
// put-target
// }


// exports.handler = async (event) => {
//     // TODO implement
//     const response = {
//         statusCode: 200,
//         body: JSON.stringify('Hello from Lambda!')
//     };
//     return response;
// };
//var assert = require('assert');
//var http = require('http');
/* var AWS = require('aws-sdk');
 * 
 * exports.handler = function(event, context) {
 *     const codepipeline = new AWS.CodePipeline();
 *     const s3 = new AWS.S3();
 *     
 *     // Retrieve the Job ID from the Lambda action
 *     var job = event["CodePipeline.job"];
 *     var jobId = job.id;
 * 
 *     // Notify AWS CodePipeline of a successful job
 *     var putJobSuccess = function(message) {
 *         var params = {
 *             jobId: jobId
 *         };
 *         codepipeline.putJobSuccessResult(params, function(err, data) {
 *             if(err) {
 *                 context.fail(err);      
 *             } else {
 *                 context.succeed(message);      
 *             }
 *         });
 *     };
 *     
 *     // Notify AWS CodePipeline of a failed job
 *     var putJobFailure = function(message) {
 *         var params = {
 *             jobId: jobId,
 *             failureDetails: {
 *                 message: JSON.stringify(message),
 *                 type: 'JobFailed',
 *                 externalExecutionId: context.invokeid
 *             }
 *         };
 *         codepipeline.putJobFailureResult(params, function(err, data) {
 *             context.fail(message);
 *         });
 *     };
 *     
 *     const { bucketName, objectKey } = job.data.inputArtifacts[0].location.s3Location
 *     const params = {
 *         Bucket: bucketName, 
 *         Key: objectKey
 *     };
 *     s3.getObject(params, (err, data) => {
 *         // TODO: S3 に拒否られる
 *         // Response:
 *         // {
 *         //   "errorMessage": "Access Denied",
 *         //   "errorType": "AccessDenied",
 *         //   "stackTrace": [
 *         //     "Request.extractError (/var/runtime/node_modules/aws-sdk/lib/services/s3.js:577:35)",
 *         //     "Request.callListeners (/var/runtime/node_modules/aws-sdk/lib/sequential_executor.js:105:20)",
 *         //     "Request.emit (/var/runtime/node_modules/aws-sdk/lib/sequential_executor.js:77:10)",
 *         //     "Request.emit (/var/runtime/node_modules/aws-sdk/lib/request.js:683:14)",
 *         //     "Request.transition (/var/runtime/node_modules/aws-sdk/lib/request.js:22:10)",
 *         //     "AcceptorStateMachine.runTo (/var/runtime/node_modules/aws-sdk/lib/state_machine.js:14:12)",
 *         //     "/var/runtime/node_modules/aws-sdk/lib/state_machine.js:26:10",
 *         //     "Request.<anonymous> (/var/runtime/node_modules/aws-sdk/lib/request.js:38:9)",
 *         //     "Request.<anonymous> (/var/runtime/node_modules/aws-sdk/lib/request.js:685:12)",
 *         //     "Request.callListeners (/var/runtime/node_modules/aws-sdk/lib/sequential_executor.js:115:18)"
 *         //   ]
 *         // }
 *         
 *         // Request ID:
 *         // "683c75ac-cdfe-11e8-9566-7d1bb2c2cbf8"
 *         
 *         // Function Logs:
 *         // START RequestId: 683c75ac-cdfe-11e8-9566-7d1bb2c2cbf8 Version: $LATEST
 *         // 2018-10-12T09:08:39.632Z	683c75ac-cdfe-11e8-9566-7d1bb2c2cbf8	hogehoge null
 *         // 2018-10-12T09:08:39.744Z	683c75ac-cdfe-11e8-9566-7d1bb2c2cbf8	{"errorMessage":"Access Denied","errorType":"AccessDenied","stackTrace":["Request.extractError (/var/runtime/node_modules/aws-sdk/lib/services/s3.js:577:35)","Request.callListeners (/var/runtime/node_modules/aws-sdk/lib/sequential_executor.js:105:20)","Request.emit (/var/runtime/node_modules/aws-sdk/lib/sequential_executor.js:77:10)","Request.emit (/var/runtime/node_modules/aws-sdk/lib/request.js:683:14)","Request.transition (/var/runtime/node_modules/aws-sdk/lib/request.js:22:10)","AcceptorStateMachine.runTo (/var/runtime/node_modules/aws-sdk/lib/state_machine.js:14:12)","/var/runtime/node_modules/aws-sdk/lib/state_machine.js:26:10","Request.<anonymous> (/var/runtime/node_modules/aws-sdk/lib/request.js:38:9)","Request.<anonymous> (/var/runtime/node_modules/aws-sdk/lib/request.js:685:12)","Request.callListeners (/var/runtime/node_modules/aws-sdk/lib/sequential_executor.js:115:18)"]}
 *         // END RequestId: 683c75ac-cdfe-11e8-9566-7d1bb2c2cbf8
 *         // REPORT RequestId: 683c75ac-cdfe-11e8-9566-7d1bb2c2cbf8	Duration: 818.96 ms	Billed Duration: 900 ms 	Memory Size: 128 MB	Max Memory Used: 33 MB	
 * 
 *         if (err) {
 *             putJobFailure(err);
 *         } else {
 *             console.log(data);
 *             console.log(data.Body);
 *             putJobSuccess('OK');
 *         }
 *     });
 * 
 *     // // Validate the URL passed in UserParameters
 *     // if(!url || url.indexOf('http://') === -1) {
 *     //     putJobFailure('The UserParameters field must contain a valid URL address to test, including http:// or https://');  
 *     //     return;
 *     // }
 *     
 *     // // Helper function to make a HTTP GET request to the page.
 *     // // The helper will test the response and succeed or fail the job accordingly 
 *     // var getPage = function(url, callback) {
 *     //     var pageObject = {
 *     //         body: '',
 *     //         statusCode: 0,
 *     //         contains: function(search) {
 *     //             return this.body.indexOf(search) > -1;    
 *     //         }
 *     //     };
 *     //     http.get(url, function(response) {
 *     //         pageObject.body = '';
 *     //         pageObject.statusCode = response.statusCode;
 *             
 *     //         response.on('data', function (chunk) {
 *     //             pageObject.body += chunk;
 *     //         });
 *             
 *     //         response.on('end', function () {
 *     //             callback(pageObject);
 *     //         });
 *             
 *     //         response.resume(); 
 *     //     }).on('error', function(error) {
 *     //         // Fail the job if our request failed
 *     //         putJobFailure(error);    
 *     //     });           
 *     // };
 *     
 *     // getPage(url, function(returnedPage) {
 *     //     try {
 *     //         // Check if the HTTP response has a 200 status
 *     //         assert(returnedPage.statusCode === 200);
 *     //         // Check if the page contains the text "Congratulations"
 *     //         // You can change this to check for different text, or add other tests as required
 *     //         assert(returnedPage.contains('Example Domain'));  
 *             
 *     //         // Succeed the job
 *     //         putJobSuccess("Tests passed.");
 *     //     } catch (ex) {
 *     //         // If any of the assertions failed then fail the job
 *     //         putJobFailure(ex);    
 *     //     }
 *     // });     
 * }; */
