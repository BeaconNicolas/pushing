/*
 * Content of the interactive build guide: "Terraform CI/CD on AWS with a GitHub trigger".
 * It follows the PDF in assets/docs/. Edit the text here; guide.js draws the page.
 * {env} is replaced with dev, int or prod when the reader switches environment.
 * Account IDs, bucket names, email addresses and tokens are left out on purpose.
 */
window.GUIDE = {
  pdf: "../assets/docs/terraform-cicd-on-aws-build-guide.pdf",
  author: "Beacon Nicolas Mkhabele",
  date: "October 2026",

  stats: [
    { value: "3", label: "environments: dev, int and prod" },
    { value: "5", label: "pipeline stages, with a manual approval before apply" },
    { value: "1→3", label: "one CI/CD account, one target account per environment" },
    { value: "0", label: "long-lived AWS keys stored anywhere" },
  ],

  placeholders: [
    { name: "<project>", meaning: "your resource name prefix" },
    { name: "ENV", meaning: "dev, int or prod" },
    { name: "<owner>/<repo>", meaning: "your GitHub repository" },
    { name: "<cicd-account-id>", meaning: "the account that runs the pipelines" },
  ],

  summary: [
    "A merge to the dev, int or prod branch zips the repository and uploads it to an S3 bucket. The upload starts the AWS CodePipeline for that environment. The pipeline builds a tools image, runs Maven, runs terraform plan, waits for a person to approve, and then applies the saved plan.",
    "All three pipelines live in one AWS account, the CI/CD account. Each pipeline assumes a deployer role in its own target account to plan and apply. GitHub never holds credentials that can change infrastructure: its only permission is to upload the source zip.",
  ],

  reasons: [
    { icon: "clock", tone: "iam", title: "No stored AWS keys", text: "GitHub gets temporary credentials through OIDC. Every other step assumes an IAM role. Nothing long-lived is kept in GitHub or in the pipeline." },
    { icon: "branch", tone: "aws", title: "One pipeline per environment", text: "Each branch uploads to its own key, ENV/source.zip. The EventBridge rule for that key starts only that environment's pipeline." },
    { icon: "lock", tone: "iam", title: "Least access per role", text: "GitHub's role can only upload its own source.zip. Each build role can assume only its own environment's deployer role." },
    { icon: "user-check", tone: "github", title: "A person approves every apply", text: "The pipeline stops after Plan and sends an SNS email. A reviewer reads the plan and approves or rejects it in the console." },
    { icon: "file-check", tone: "aws", title: "Apply what was reviewed", text: "Plan fails if anything would be destroyed. Apply uses the saved plan, then runs a fresh plan that must show no changes." },
    { icon: "box", tone: "aws", title: "Pinned tools", text: "The Docker stage builds one tools image (Terraform, TFLint, AWS CLI, jq, Maven) and pushes it to ECR with a pinned, immutable tag." },
  ],

  accountNote:
    "In the original setup the pipelines run in the prod account. A dedicated tooling account isolates them better; the trade-offs section covers this.",

  // The eight steps of one run. `lane` colours the step: github (GitHub and people), aws or iam.
  steps: [
    {
      n: 1, name: "Merge", sub: "GitHub branch", actor: "Developer", lane: "github",
      what: "Merges a change into {env}.",
      creds: "None needed in AWS.",
      highlight: ["dev", "repo", "e-merge"],
      log: ["Pull request merged into {env}"],
    },
    {
      n: 2, name: "Upload", sub: "Actions + OIDC", actor: "GitHub Actions", lane: "github",
      what: "Assumes <project>-cicd-github-{env} through OIDC, zips the repo and uploads {env}/source.zip to the source bucket.",
      creds: "A short-lived OIDC token, exchanged for <project>-cicd-github-{env}. That role can only upload {env}/source.zip.",
      highlight: ["repo", "actions", "oidc", "s3", "e-push", "e-oidc", "e-put"],
      log: [
        "OIDC token issued for repo:<owner>/<repo>:ref:refs/heads/{env}",
        "Assumed <project>-cicd-github-{env}",
        "Uploaded {env}/source.zip to the source bucket",
      ],
    },
    {
      n: 3, name: "Trigger", sub: "S3 → EventBridge", actor: "S3 + EventBridge", lane: "aws",
      what: "The upload event starts the pipeline for {env} only.",
      creds: "EventBridge uses <project>-cicd-events-{env}, which may start only its own pipeline.",
      highlight: ["s3", "rule", "pipeline", "e-upload", "e-start"],
      log: ["Upload event on {env}/source.zip matched the {env} rule", "Started pipeline <project>-cicd-{env}"],
    },
    {
      n: 4, name: "Docker", sub: "tools image", actor: "Docker stage", lane: "aws",
      what: "Builds the tools image (Terraform, TFLint, AWS CLI, jq, Maven) and pushes it to ECR with a pinned tag. If the tag already exists, it skips the build.",
      creds: "Runs as <project>-cicd-codebuild-{env}, which may push and pull only its own ECR repository.",
      highlight: ["docker", "ecr", "e-ecr"],
      log: ["Checked ECR for the pinned tools_image_tag", "Tag already exists, so the build is skipped"],
    },
    {
      n: 5, name: "Maven", sub: "Maven command", actor: "Maven stage", lane: "aws",
      what: "Runs the Maven command inside the tools image.",
      creds: "Runs as <project>-cicd-codebuild-{env}.",
      highlight: ["maven", "e-maven"],
      log: ["Ran the Maven command inside the tools image"],
    },
    {
      n: 6, name: "Plan", sub: "lint · plan", actor: "Plan stage", lane: "aws",
      what: "Assumes the deployer role in the {env} account. Runs fmt -check, tflint, init, validate and plan. Fails if the plan would destroy anything.",
      creds: "<project>-cicd-codebuild-{env} assumes <project>-terraform-deployer in the {env} account.",
      highlight: ["plan", "deployer", "e-plan", "e-assume-plan"],
      log: [
        "Assumed <project>-terraform-deployer in the {env} account",
        "terraform fmt -check: ok",
        "tflint: ok",
        "terraform init: ok",
        "terraform validate: ok",
        "terraform plan -out: plan saved",
        "Destroy guard: nothing would be destroyed",
      ],
      destroyLog: [
        "Assumed <project>-terraform-deployer in the {env} account",
        "terraform fmt -check: ok",
        "tflint: ok",
        "terraform init: ok",
        "terraform validate: ok",
        "terraform plan -out: plan saved",
        "!Destroy guard: the plan would destroy a resource. The stage fails and nothing is applied.",
      ],
    },
    {
      n: 7, name: "Approve", sub: "SNS email", actor: "Approve stage", lane: "aws",
      what: "Sends an SNS email. A reviewer reads the plan and approves or rejects in the console.",
      creds: "The pipeline role <project>-cicd-pipeline-{env} may publish only to its own approval topic.",
      highlight: ["approve", "sns", "reviewer", "e-approve", "e-notify", "e-email", "e-decide"],
      log: ["Approval request emailed through SNS", "Reviewer read the plan and approved it"],
      rejectLog: ["Approval request emailed through SNS", "!Reviewer rejected the plan. Nothing is applied."],
    },
    {
      n: 8, name: "Apply", sub: "saved plan", actor: "Apply stage", lane: "aws",
      what: "Applies the exact saved plan, then runs a post-apply plan that must exit 0.",
      creds: "<project>-cicd-codebuild-{env} assumes <project>-terraform-deployer in the {env} account again.",
      highlight: ["apply", "deployer", "resources", "e-apply", "e-assume-apply", "e-manage"],
      log: [
        "Assumed <project>-terraform-deployer in the {env} account",
        "terraform apply of the saved plan: done",
        "Post-apply terraform plan -detailed-exitcode: exit 0, nothing left to change",
      ],
    },
  ],

  roles: [
    {
      id: "github", label: "GitHub upload role", name: "<project>-cicd-github-{env}", account: "CI/CD",
      from: "GitHub OIDC provider (GHES token issuer)",
      trust: "aud = sts.amazonaws.com and sub = repo:<owner>/<repo>:ref:refs/heads/{env}",
      perms: "s3:PutObject on {env}/source.zip; KMS GenerateDataKey and Decrypt on the CI/CD key",
      reaches: "S3 source bucket, key {env}/source.zip",
    },
    {
      id: "events", label: "EventBridge role", name: "<project>-cicd-events-{env}", account: "CI/CD",
      from: "EventBridge service (events.amazonaws.com)",
      trust: "Service principal (see the note below)",
      perms: "codepipeline:StartPipelineExecution on its own pipeline",
      reaches: "CodePipeline <project>-cicd-{env}",
    },
    {
      id: "pipeline", label: "Pipeline role", name: "<project>-cicd-pipeline-{env}", account: "CI/CD",
      from: "CodePipeline service (codepipeline.amazonaws.com)",
      trust: "Service principal (see the note below)",
      perms: "Read the source object, read and write artifacts, KMS on the CI/CD key, start and read CodeBuild projects, sns:Publish to its approval topic",
      reaches: "CodeBuild projects: Docker, Maven, Plan, Apply",
    },
    {
      id: "codebuild", label: "Build role", name: "<project>-cicd-codebuild-{env}", account: "CI/CD",
      from: "CodeBuild service (codebuild.amazonaws.com)",
      trust: "Service principal (see the note below)",
      perms: "Write logs, read and write artifacts, KMS, ECR push and pull on its own repository, sts:AssumeRole on its environment's deployer role",
      reaches: "The deployer role in the {env} account",
    },
    {
      id: "deployer", label: "Deployer role", name: "<project>-terraform-deployer", account: "{env} account",
      from: "The CI/CD account",
      trust: "aws:PrincipalArn = the <project>-cicd-codebuild-{env} role ARN",
      perms: "The Terraform state bucket and its KMS key, plus the specific resources Terraform manages",
      reaches: "Managed resources, Terraform state and KMS",
    },
  ],

  designRules: [
    { icon: "clock", tone: "iam", title: "No long-lived keys", text: "The upload uses OIDC. Everything else uses role assumption, so every credential is temporary." },
    { icon: "branch", tone: "aws", title: "One role per branch", text: "The OIDC trust matches the branch in sub, so the dev branch can assume only <project>-cicd-github-dev, and so on." },
    { icon: "lock", tone: "iam", title: "Exact deployer trust", text: "The deployer trusts the CI/CD account only when aws:PrincipalArn is the matching build role ARN. No other principal in that account can assume it." },
  ],

  roleNotes: [
    { tone: "info", title: "Trust conditions on the service roles", text: "The source notes name only the service principal for the events, pipeline and CodeBuild roles. Check the trust policy JSON in your iam module before you copy it. If it has no aws:SourceAccount or aws:SourceArn condition, consider adding one." },
    { tone: "ok", title: "Reading a role name", text: "<project>-cicd-codebuild-dev is the build role of the dev pipeline. It lives in the CI/CD account and may assume only <project>-terraform-deployer in the dev account." },
  ],

  buildSteps: [
    {
      title: "Prerequisites",
      points: [
        "Decide which account holds the CI/CD. A dedicated tooling account is better than a workload account.",
        "Confirm that GitHub can issue OIDC tokens and that AWS can reach the token issuer. Without this the OIDC provider will not work.",
        "Set up an S3 backend for Terraform state, and AWS SSO profiles for each account.",
      ],
    },
    {
      title: "CI/CD stack",
      where: "applied in the CI/CD account · cicd/",
      intro: "Split the stack into modules:",
      modules: [
        ["kms", "One key for the buckets, logs and artifacts, with a key policy."],
        ["s3", "The source bucket and the artifact bucket: encrypted, versioned, TLS-only, public access blocked, with an event notification on upload."],
        ["ecr", "One tools-image repository per environment: immutable tags, scan on push, KMS encryption."],
        ["sns", "One approval topic per environment, with email subscriptions."],
        ["iam", "The GitHub OIDC provider and the four CI/CD role types, with their JSON policy files."],
        ["codebuild", "The Docker, Maven, Plan and Apply projects for each environment, with their buildspecs."],
        ["pipeline", "One pipeline per environment, plus the EventBridge rule on ENV/source.zip."],
      ],
      outro: "Steps 2 and 3 are Terraform you apply by hand once. After that, every change goes through the pipeline.",
    },
    {
      title: "Deployer roles",
      where: "applied once in each target account · cicd/deployer/",
      points: [
        "Create <project>-terraform-deployer in the dev, int and prod accounts.",
        "Each one trusts the CI/CD account, restricted with aws:PrincipalArn to that environment's <project>-cicd-codebuild-ENV role.",
        "Give it the state bucket, its KMS key and the resources Terraform manages, nothing more.",
      ],
    },
    {
      title: "Tools image",
      where: "docker/",
      points: [
        "Write a Dockerfile with Terraform, TFLint, AWS CLI, jq and Maven. The Docker stage builds it and pushes the tag set in tools_image_tag.",
        "ECR tags are immutable, so bump tools_image_tag whenever the Dockerfile changes. Otherwise the stage sees the old tag and skips the build.",
        "Pin the Ubuntu base image to the previous release and run as a non-root USER.",
      ],
    },
    {
      title: "GitHub workflow",
      points: [
        "Trigger on a push to dev, int or prod, filtered to the infrastructure path.",
        "The job assumes the matching OIDC role, zips the repo and uploads <branch>/source.zip.",
        "A workflow_dispatch trigger lets you run it by hand when the path filter does not match.",
      ],
    },
    {
      title: "Repository variables",
      points: ["Two variables: the CI/CD account ID and the source bucket name. No AWS keys are stored in GitHub."],
    },
    {
      title: "Pipeline stages and buildspecs",
      where: "one CodeBuild buildspec per stage",
      chains: [
        { stage: "Docker", lane: "aws", links: ["tag exists in ECR?", "yes: skip", "no: build tools image", "push pinned tag"] },
        { stage: "Maven", lane: "aws", links: ["run the Maven command inside the tools image"], note: "The notes do not name the Maven goal. Read it from the Maven buildspec in your repository." },
        { stage: "Plan", lane: "aws", links: ["assume deployer role", "fmt -check", "tflint", "init", "validate", "plan, saved", "destroy guard"], note: "The build fails on unformatted files, lint errors, invalid configuration, or any planned destroy." },
        { stage: "Approve", lane: "github", links: ["SNS email", "reviewer reads the plan", "approve or reject in the console"] },
        { stage: "Apply", lane: "aws", links: ["assume deployer role", "apply the saved plan", "post-apply plan -detailed-exitcode", "must exit 0"], note: "Exit code 0 proves that the applied state matches the code and nothing is left to change." },
      ],
    },
    {
      title: "Local checks",
      where: "pre-push hook",
      points: ["A pre-push hook runs terraform fmt, tflint --fix and terraform validate on each Terraform root, so failures show up before the pipeline runs."],
    },
    {
      title: "Promotion",
      where: "dev → int → prod",
      points: [
        "Test on dev, then merge the same code into int, then into prod.",
        "Before each merge, run a local terraform plan against the next environment.",
        "Read the Plan stage output before you approve.",
      ],
      promotion: true,
    },
  ],

  problems: [
    { where: "Docker stage", lane: "aws", symptom: "tar: Function not implemented", cause: "The newest Ubuntu base image does not work with CodeBuild's Docker.", fix: "Pin the base image to the previous Ubuntu release." },
    { where: "Plan stage", lane: "aws", symptom: "terraform fmt -check fails", cause: "Files were pushed without being formatted.", fix: "Format locally first. The pre-push hook does this." },
    { where: "Plan and local", lane: "aws", symptom: "TFLint warnings on modules", cause: "Modules without version constraints.", fix: "Add versions.tf with required_version and a provider version to every module." },
    { where: "Apply stage", lane: "aws", symptom: "Post-apply plan not clean with no real changes", cause: "A data source inside a check block is deferred to apply, so plan -detailed-exitcode returns 2.", fix: "Declare the data source outside the check block." },
    { where: "Apply stage", lane: "aws", symptom: "Saved plan is stale", cause: "Two pipeline executions overlapped.", fix: "Start a fresh execution and approve only the newest one." },
    { where: "GitHub Actions", lane: "github", symptom: "Workflow did not start", cause: "The path filter did not match, or the workflow file is not on that branch.", fix: "Fix the filter or add the file to the branch. Run it by hand with workflow_dispatch." },
    { where: "Repository scan", lane: "github", symptom: "IaC scanner findings", cause: "Findings on the ECR repository and the Dockerfile.", fix: "Use immutable ECR tags and a non-root USER in the Dockerfile." },
  ],
  habits: "Run the pre-push hook before every push. Approve only the newest pipeline execution. When you change the Dockerfile, bump tools_image_tag in the same commit.",

  gains: [
    "Everything runs inside AWS, and every credential is short-lived.",
    "GitHub can only upload a zip. It cannot change infrastructure directly.",
    "Each environment has its own pipeline, roles and approval topic.",
    "A person approves every apply, and Apply changes only what was planned.",
  ],
  costs: [
    "Two systems to maintain: GitHub Actions and CodePipeline.",
    "The plan is in the build logs, not on the pull request. A read-only plan job in Actions could add that.",
    "Hosting the CI/CD in a workload account (here prod) is simpler, but a dedicated tooling account isolates it better.",
  ],
  comparison: {
    note: "A general comparison of the two approaches. It was not measured in this project.",
    columns: ["This design", "Everything in GitHub Actions"],
    rows: [
      ["Where Terraform runs", "CodeBuild, inside AWS", "A GitHub-hosted or self-hosted runner"],
      ["What GitHub can do in AWS", "Upload ENV/source.zip, nothing else", "Assume roles that change infrastructure"],
      ["Credentials", "OIDC for the upload, role assumption for the rest", "OIDC from the runner to a role in each target account"],
      ["Manual approval", "CodePipeline approval action with SNS email", "GitHub environment protection rules, where your GitHub plan supports them"],
      ["Where the plan is shown", "CodeBuild logs", "Can be posted on the pull request"],
      ["Systems to maintain", "Two: GitHub Actions and CodePipeline", "One"],
    ],
  },
  openPoints: [
    "The exact Maven command the Maven stage runs.",
    "How the destroy guard reads the plan in the Plan buildspec.",
    "The trust conditions on the events, pipeline and CodeBuild roles.",
    "The Terraform, TFLint and provider versions pinned in the tools image and in versions.tf.",
  ],

  terms: [
    ["OIDC (OpenID Connect)", "GitHub gives each workflow run a short-lived signed token. AWS checks the token and returns temporary credentials for one role. No AWS keys are stored in GitHub."],
    ["AssumeRole", "An AWS identity asks STS for temporary credentials of another role. The role's trust policy decides who may ask."],
    ["Trust policy and permissions", "The trust policy says who may assume a role. The permissions policy says what the role may do once assumed."],
    ["Saved plan", "terraform plan -out writes the planned changes to a file. Applying that file makes exactly those changes, nothing else."],
    ["Destroy guard", "A check in the Plan stage. The build fails if the plan would destroy any resource."],
    ["Detailed exit code", "terraform plan -detailed-exitcode returns 0 for no changes, 1 for an error and 2 when changes are pending."],
    ["Tools image", "A Docker image with Terraform, TFLint, AWS CLI, jq and Maven, stored in ECR under a pinned tag."],
    ["Promotion", "Moving the same code from dev to int to prod by merging it from one branch into the next."],
  ],
};
