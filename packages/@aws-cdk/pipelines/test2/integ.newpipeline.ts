// eslint-disable-next-line import/no-extraneous-dependencies
import * as sqs from '@aws-cdk/aws-sqs';
import { App, Construct, Stack, StackProps, Stage, StageProps } from '@aws-cdk/core';
import * as pipelines from '../lib2';

class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const pipeline = new pipelines.CdkPipeline(this, 'Pipeline', {
      source: pipelines.Source.gitHub('rix0rrr/cdk-pipelines-demo'),
      synth: pipelines.Synth.standardNpm(),
    });

    pipeline.addApplicationStage(new AppStage(this, 'Beta'));

    const group = pipeline.addDeploymentGroup('Wave1');
    group.addApplicationStage(new AppStage(this, 'Prod1'));
    group.addApplicationStage(new AppStage(this, 'Prod2'));
  }
}

class AppStage extends Stage {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    const stack1 = new Stack(this, 'Stack1');
    const queue1 = new sqs.Queue(stack1, 'Queue');

    const stack2 = new Stack(this, 'Stack2');
    new sqs.Queue(stack2, 'OtherQueue', {
      deadLetterQueue: {
        queue: queue1,
        maxReceiveCount: 5,
      },
    });
  }
}

const app = new App({
  context: {
    '@aws-cdk/core:newStyleStackSynthesis': '1',
  },
});
new PipelineStack(app, 'PipelineStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});
app.synth();