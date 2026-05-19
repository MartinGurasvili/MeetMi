# ECS task definition templates (reference)

These JSON files were used for manual console registration. **Terraform is the source of truth:** [../terraform/README.md](../terraform/README.md).

You can still register task definitions manually if needed:

```bash
aws ecs register-task-definition --cli-input-json file://infra/ecs/task-definition-backend.json
aws ecs register-task-definition --cli-input-json file://infra/ecs/task-definition-frontend.json
```

Console walkthrough: [docs/aws-ecs-console-setup.md](../../docs/aws-ecs-console-setup.md).
