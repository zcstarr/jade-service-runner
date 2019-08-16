aws cloudformation create-stack \
    --stack-name jade-service-runner-staging-beanstalk-stack \
    --template-body file://jade-service-runner.cfn.json \
    --parameters file://staging-launch-params.json \
    --capabilities CAPABILITY_IAM \
    --disable-rollback

aws cloudformation wait stack-create-complete --stack-name jade-service-runner-staging-beanstalk-stack
