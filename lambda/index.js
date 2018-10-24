const AWS = require('aws-sdk');

// ベタで ECS スケジュールタスクを作ってみる

// メモ
//   同名の rule があってもエラーにならない
//   同 ID の target があってもエラーにならず、更新してくれる
exports.handler = function(event, context) {
  const events = new AWS.CloudWatchEvents();
  // put-rule
  const ruleParams = {
    Name: 'STRING_VALUE', /* required */
    /* Description: 'STRING_VALUE',
     * EventPattern: 'STRING_VALUE',
     * RoleArn: 'STRING_VALUE', */
    ScheduleExpression: 'cron(0 20 * * ? *)',
    State: 'ENABLED'
  };
  events.putRule(ruleParams, (err, data) => {
    if (err) {
      console.log(err, err.stack);
      context.fail('failed');
      return;
    }

    const clusterArn = 'arn:aws:ecs:ap-northeast-1:826145371799:cluster/everydayrails';
    const launcherRoleArn = 'arn:aws:iam::826145371799:role/ecsEventsRole';
    const input = {
      containerOverrides: [
        {
          name: "everydayrails",
          command: ["bundle", "exec", "rake", "cron:sample2"]
        }
      ]
    }
    const taskDefArn = 'arn:aws:ecs:ap-northeast-1:826145371799:task-definition/run-everydayrails:14';
    const taskCount = 1;
    const serviceSecurityGroup = 'sg-08d44aff88f94ca0c';
    const clusterSubnets = ['subnet-0b4643dd6e5f4ce45', 'subnet-0503d848f83020ede'];
    const targetParams = {
      Rule: ruleParams['Name'],
      Targets: [
        {
          Id: 'lambda-made-target',
          Arn: clusterArn,
          RoleArn: launcherRoleArn,
          Input: JSON.stringify(input),
          EcsParameters: {
            TaskDefinitionArn: taskDefArn,
            TaskCount: 1,
            LaunchType: 'FARGATE',
            NetworkConfiguration: {
              awsvpcConfiguration: {
                AssignPublicIp: 'ENABLED',
                SecurityGroups: [serviceSecurityGroup],
                Subnets: clusterSubnets,
              }
            },
            PlatformVersion: 'LATEST'
          }
        }
      ]
    }
    events.putTargets(targetParams, (err, data) => {
      if (err) console.log(err, err.stack);
      else console.log(data);
      context.succeed('done');
    })

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
  })
  // put-target
}


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
