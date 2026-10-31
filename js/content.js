/*
 * ─────────────────────────────────────────────────────────────
 *  YOUR PORTFOLIO CONTENT — edit this file to update the site.
 * ─────────────────────────────────────────────────────────────
 *  - Text goes between the quotes. Keep the commas between items.
 *  - Leave a field as "" to hide it (e.g. email or resume).
 *  - To add a project, copy one { ... } block inside `projects`,
 *    paste it after a comma, and change the text.
 *  - Save, commit and push: GitHub Pages updates in about a minute.
 */
window.PORTFOLIO = {
  profile: {
    name: "Beacon Nicolas Mkhabele",
    initials: "BM",
    role: "Data Scientist · BMW IT Hub South Africa",
    location: "Pretoria, Gauteng, South Africa",
    availability: "Open to data science and cloud roles",
    tagline:
      "I build production data science on AWS: optimisation pipelines in Python, the Terraform infrastructure underneath them, and the CI/CD that ships them from development to production.",

    // Contact links. Leave "" to hide a button.
    email: "", // e.g. "yourname@gmail.com"
    linkedin: "https://www.linkedin.com/in/beacon-mkhabele-b47b62201",
    github: "https://github.com/BeaconNicolas",

    // Put your CV in the assets folder and set this to "assets/resume.pdf".
    resume: "",

    // Optional headshot, e.g. "assets/photo.jpg". Leave "" to show your initials.
    photo: "",
  },

  // Three quick numbers shown under the intro.
  stats: [
    { value: "~3 yrs", label: "at BMW IT Hub, from graduate consultant to data scientist" },
    { value: "1.5 yrs", label: "teaching machine learning and data analytics at 2U" },
    { value: "AWS", label: "Certified Cloud Practitioner" },
  ],

  // "At a glance" tile in the Selected work grid. Numbers count up when shown.
  // Keep these factual: recruiters read them as claims.
  telemetry: [
    { value: "4", label: "AWS accounts in the multi-account design (Dev, INT, Prod, Tooling)" },
    { value: "3", label: "environments the MILP pipeline deploys to" },
    { value: "+672", label: "lines in my latest Terraform pull request (Oct 2026)" },
  ],

  // Code tile in the Selected work grid. `lang` is "python" or "hcl" (Terraform).
  // These are small examples written for this site, not BMW code.
  snippets: {
    note: "Illustrative examples written for this site (the Python uses the open-source PuLP library), not BMW code.",
    files: [
      {
        file: "toy_milp.py",
        lang: "python",
        code: [
          "import pulp",
          "",
          "model = pulp.LpProblem(\"allocation\", pulp.LpMinimize)",
          "x = pulp.LpVariable.dicts(\"x\", (plants, parts), lowBound=0, cat=\"Integer\")",
          "is_open = pulp.LpVariable.dicts(\"open\", plants, cat=\"Binary\")",
          "",
          "# Production cost plus the fixed cost of opening a plant",
          "model += pulp.lpSum(cost[p][k] * x[p][k] for p in plants for k in parts) \\",
          "    + pulp.lpSum(fixed[p] * is_open[p] for p in plants)",
          "",
          "for k in parts:  # meet demand for every part",
          "    model += pulp.lpSum(x[p][k] for p in plants) >= demand[k]",
          "for p in plants:  # only produce in plants that are open",
          "    model += pulp.lpSum(x[p][k] for k in parts) <= capacity[p] * is_open[p]",
          "",
          "model.solve(pulp.PULP_CBC_CMD(msg=False))",
          "print(pulp.LpStatus[model.status], pulp.value(model.objective))",
        ].join("\n"),
      },
      {
        file: "queue.tf",
        lang: "hcl",
        code: [
          "# Buffer solve requests between the trigger and the solver",
          "resource \"aws_sqs_queue\" \"solve_requests\" {",
          "  name                       = \"${var.prefix}-solve-requests\"",
          "  visibility_timeout_seconds = 900",
          "",
          "  redrive_policy = jsonencode({",
          "    deadLetterTargetArn = aws_sqs_queue.solve_dlq.arn",
          "    maxReceiveCount     = 3",
          "  })",
          "",
          "  tags = local.common_tags",
          "}",
          "",
          "resource \"aws_lambda_event_source_mapping\" \"solver\" {",
          "  event_source_arn = aws_sqs_queue.solve_requests.arn",
          "  function_name    = aws_lambda_function.solver.arn",
          "  batch_size       = 1",
          "}",
        ].join("\n"),
      },
    ],
  },

  about: [
    "I'm a data scientist at BMW IT Hub South Africa in Pretoria, where I own a multi-step AWS pipeline that solves mixed-integer linear programming (MILP) models. I joined BMW IT Hub as a data science graduate in 2024 and spent nearly two years on the DevOps and AWS side, so I don't stop at the model: I also build the Terraform infrastructure, CI/CD pipelines and multi-account AWS setup that keep it running in production.",
    "My foundation is mathematical, with a BSc in Applied Mathematics and Mathematical Statistics from Rhodes University. I also spent a year and a half as an instructional specialist on 2U's data analytics and machine learning boot camps, mentoring students and grading their work in Python, machine learning, deep learning and Tableau.",
  ],

  // Shown next to the About text.
  facts: [
    { label: "Based in", value: "Pretoria, South Africa" },
    { label: "Currently", value: "Data Scientist, BMW IT Hub South Africa" },
    { label: "Focus", value: "Optimisation, cloud data pipelines, MLOps" },
    { label: "Degree", value: "BSc Applied Mathematics & Mathematical Statistics" },
    { label: "Main tools", value: "Python, AWS, Terraform, Docker" },
  ],

  // Contribution graph from your BMW GitHub account (the repositories belong to BMW).
  // `levels` has one digit per day from 1 January: 0 = none, 1–4 = low to very high,
  // copied from GitHub's graph. `total` is the number GitHub shows for that year.
  // To update: take a new screenshot and ask for the digits to be re-read, or add days.
  activity: {
    note: "Contributions on my BMW IT Hub GitHub account from January 2025 to 12 October 2026. GitHub counts commits, pull requests, issues and code reviews as contributions. The repositories belong to BMW, so this shows my activity rather than the code.",
    totalLabel: "contributions from January 2025 to 12 October 2026",
    years: [
      {
        year: 2026,
        total: 224,
        label: "(1 January to 12 October)",
        levels:
        "0000000000000101002230100100000011000000300000001110010100000011000010100" +
        "0230000000200000012000000000040100000001000000000000011002201000010020010" +
        "1000003100000111000000000010110000001000011200010000000000000000000000000" +
        "000000000000000000000000001000000000000000000000000000000011110001",
      },
      {
        year: 2025,
        total: 236,
        levels:
        "0000000000000000000000000000000000000000001000001100000110000000000000100" +
        "0000000000000000000000000000000000000000000000111001011000001000001100000" +
        "1100000010000001000000100000010000001000001100000001100001000000100000010" +
        "0001010000011000000110000000000000000000110000000000011000000001000000000" +
        "0000000100110003120001311100111430000111000101000111210000000000000000000",
      },
    ],
    highlights: [
      {
        period: "Oct 2026",
        text: "5 commits and a pull request (+672 lines) to the Terraform infrastructure of the MILP optimisation pipeline I own, including a new SQS queue.",
      },
      {
        period: "Dec 2025",
        text: "25 commits across two repositories.",
      },
    ],
  },

  // Newest first. Each company can list several roles (e.g. promotions).
  experience: [
    {
      org: "BMW IT Hub South Africa",
      place: "Pretoria",
      period: "Jan 2024 – Present",
      // Optional short pills under the company name. `badge` (optional) replaces the initials.
      badge: "BMW",
      impact: [
        "Owner of a production MILP pipeline",
        "Multi-account AWS: Dev · INT · Prod · Tooling",
        "Terraform infrastructure as code",
        "CI/CD across 3 environments",
      ],
      roles: [
        {
          title: "Data Scientist",
          period: "Oct 2026 – Present",
          points: [
            "Own and maintain the complex, multi-step AWS data science MILP (mixed-integer linear programming) pipeline for Bedarfs Kosmos.",
            "Translate the pipeline's existing AWS resources, originally built without Terraform, into Terraform infrastructure as code.",
            "Set up CI/CD pipelines to deploy the pipeline across Development, Integration and Production environments.",
            "Engineer algorithmic and architectural optimisations within the pipeline to improve performance.",
            "Provide ongoing support, delivering daily enhancements and bug fixes to highly technical, mathematical Python workflows.",
          ],
        },
        {
          title: "AWS Developer Consultant",
          period: "Oct 2025 – Sep 2026",
          points: [
            "Fixed broken AWS CI/CD pipelines, restoring deployments.",
            "Designed a multi-account architecture (Dev, INT, Prod, Tooling) and enabled cross-account deployments with IAM roles.",
            "Built Terraform-based infrastructure and populated new AWS environments from scratch.",
            "Developed AWS Glue ETL jobs and workflows, and configured Lambda, S3 and triggers.",
            "Built CI/CD pipelines with Docker, ECR and Terraform.",
          ],
        },
        {
          title: "DevOps Developer Consultant",
          period: "Jan 2025 – Oct 2025",
          points: [
            "Maintained and supported AWS cloud operations to keep data delivery smooth and reliable.",
            "Built and managed infrastructure with Terraform and set up CI/CD pipelines to streamline deployments.",
            "Developed frontend features in Angular and backend logic in Python on AWS Cloud9.",
            "Maintained AWS Lambda functions packaged and deployed as Docker images.",
            "Helped secure AWS resources by finding and fixing potential vulnerabilities.",
          ],
        },
        {
          title: "Data Science Graduate Consultant",
          period: "Jan 2024 – Jan 2025",
          points: [
            "Automated Excel workflows with Python.",
            "Cleaned, transformed and compared data.",
            "Gained hands-on AWS cloud experience and took part in hackathons.",
          ],
        },
      ],
    },
    {
      org: "2U",
      place: "Cape Town",
      period: "Sep 2023 – Mar 2025",
      impact: ["Two boot camps: ML & AI, Data Analytics", "Mentoring, feedback & grading"],
      roles: [
        {
          title: "Machine Learning and Artificial Intelligence Instructional Specialist",
          period: "Sep 2023 – Mar 2025",
          points: [
            "Mentored students in a 2U boot camp covering machine learning, Python, deep learning, TensorFlow, data science and natural language processing.",
            "Helped students with coursework, gave feedback and graded assignments.",
          ],
        },
        {
          title: "Data Analytics Instructional Specialist",
          period: "Sep 2023 – Mar 2025",
          points: [
            "Taught and mentored students in a 2U Data Analytics boot camp covering Python (NumPy, SciPy, pandas, Matplotlib), web visualisation and Tableau.",
            "Provided academic support, graded assignments and supported students throughout the programme.",
          ],
        },
      ],
    },
    {
      org: "Deviare",
      place: "Johannesburg",
      period: "May 2023 – Jan 2024",
      impact: ["6 hands-on projects", "Data and AI Master's Program certificate"],
      roles: [
        {
          title: "Digital Skills Training for Data Science",
          period: "May 2023 – Jan 2024",
          points: [
            "Python for data wrangling, probability and data visualisation.",
            "Machine learning with regression, classification, decision trees and random forests.",
            "Deep learning with TensorFlow and Keras, including CNNs, RNNs and autoencoders.",
            "Completed six hands-on projects and earned the Data and AI Master's Program certificate.",
          ],
        },
      ],
    },
    {
      org: "Rhodes University",
      place: "Makhanda",
      period: "Mar 2022 – Nov 2022",
      roles: [
        {
          title: "Statistics for Commerce Tutor",
          period: "Aug 2022 – Nov 2022",
          points: ["Explained concepts to students and marked their scripts and tutorials."],
        },
        {
          title: "Mathematics for Science Tutor",
          period: "Mar 2022 – Jun 2022",
          points: ["Explained concepts to students and marked their scripts and tutorials."],
        },
      ],
    },
    {
      org: "Inkululeko",
      place: "Makhanda",
      period: "Sep 2022 – Nov 2022",
      roles: [
        {
          title: "Mathematics Tutor",
          period: "Sep 2022 – Nov 2022",
          points: ["Taught lessons to learners and marked their scripts."],
        },
      ],
    },
  ],

  // category must match one of the filter buttons: they are created automatically.
  // context + year appear at the top right of each card.
  // `featured: true` puts a project in the large tile of the Selected work grid
  // (only the first featured one is used). `flow` is an optional row of stages shown on it.
  projects: [
    {
      title: "MILP Optimisation Pipeline on AWS",
      featured: true,
      flow: ["Development", "Integration", "Production"],
      category: "Optimisation",
      context: "BMW IT Hub",
      year: "2026",
      summary:
        "Own and maintain the multi-step AWS data science pipeline behind Bedarfs Kosmos, which solves mixed-integer linear programming (MILP) models.",
      points: [
        "Engineering algorithmic and architectural optimisations to improve the pipeline's performance.",
        "Translating its AWS resources, originally built without Terraform, into infrastructure as code.",
        "Setting up CI/CD to deploy it across Development, Integration and Production.",
        "Delivering daily enhancements and bug fixes to highly mathematical Python workflows.",
      ],
      tags: ["Python", "MILP", "AWS", "Terraform", "CI/CD"],
      links: [],
    },
    {
      title: "Multi-Account AWS Platform",
      category: "Cloud & DevOps",
      context: "BMW IT Hub",
      year: "2025–26",
      summary:
        "Designed a multi-account AWS architecture (Dev, INT, Prod and Tooling) and got broken deployments working again.",
      points: [
        "Fixed broken AWS CI/CD pipelines, restoring deployments.",
        "Enabled cross-account deployments using IAM roles.",
        "Built CI/CD with Docker, ECR and Terraform, and populated new AWS environments from scratch.",
      ],
      tags: ["AWS", "Terraform", "IAM", "Docker", "ECR"],
      links: [],
    },
    {
      title: "Serverless ETL with AWS Glue",
      category: "Cloud & DevOps",
      context: "BMW IT Hub",
      year: "2025–26",
      summary: "Built AWS Glue ETL jobs and workflows, wired up with Lambda, S3 and triggers.",
      points: [
        "Developed Glue ETL jobs and workflows to transform and move data.",
        "Configured Lambda functions, S3 buckets and the triggers that connect them.",
        "Maintained Lambda functions packaged and deployed as Docker images.",
      ],
      tags: ["AWS Glue", "Lambda", "S3", "Python", "Docker"],
      links: [],
    },
    {
      title: "Excel Workflow Automation",
      category: "Analytics",
      context: "BMW IT Hub",
      year: "2024",
      summary: "Replaced manual, repetitive Excel work with Python scripts during my graduate year.",
      points: [
        "Automated Excel workflows with Python.",
        "Cleaned, transformed and compared data as part of those workflows.",
      ],
      tags: ["Python", "Excel", "Automation"],
      links: [],
    },
    {
      title: "Lending Club Credit Policy Classification",
      category: "Machine Learning",
      context: "Deviare",
      year: "2023",
      summary:
        "Classified whether borrowers meet Lending Club's credit-underwriting criteria, using 9,578 loan records.",
      points: [
        "Screened features with t-tests and chi-square tests, and checked multicollinearity with VIF.",
        "Compared Logistic Regression (91% test accuracy) with a Random Forest tuned by GridSearchCV (99%).",
        "Built a deep Keras/TensorFlow network with early stopping.",
      ],
      tags: ["Python", "TensorFlow", "Keras", "scikit-learn"],
      links: [
        {
          label: "Code",
          url: "https://github.com/BeaconNicolas/Data_Science/tree/main/Deviare_Data%20Science_Projects",
        },
      ],
    },
    {
      title: "Mercedes-Benz Greener Manufacturing",
      category: "Machine Learning",
      context: "Deviare",
      year: "2023",
      summary:
        "Prepared about 380 anonymised car-configuration features for predicting test-bench time. Shorter testing means lower CO₂ emissions.",
      points: [
        "Removed zero-variance features and label-encoded the categorical columns.",
        "Standardised the data and reduced its dimensionality with PCA.",
        "Set up XGBoost and linear regression models on the prepared features.",
      ],
      tags: ["Python", "PCA", "XGBoost", "scikit-learn"],
      links: [
        {
          label: "Write-up",
          url: "https://github.com/BeaconNicolas/Data_Science/tree/main/Deviare_Data%20Science_Projects",
        },
      ],
    },
    {
      title: "Creating Cohorts of Songs",
      category: "Machine Learning",
      context: "Deviare",
      year: "2023",
      summary:
        "Explored Spotify audio features for Rolling Stones tracks as the groundwork for grouping songs into cohorts for recommendations.",
      points: [
        "Removed duplicates and IQR outliers, then explored popularity, albums and audio features.",
        "Modelled popularity from danceability and energy with OLS regression.",
        "Standardised the features and used the elbow method to pick the number of K-Means clusters.",
      ],
      tags: ["Python", "pandas", "statsmodels", "K-Means"],
      links: [
        {
          label: "Code",
          url: "https://github.com/BeaconNicolas/Data_Science",
        },
      ],
    },
    {
      title: "NYC 311 Customer Service Requests",
      category: "Analytics",
      context: "Deviare",
      year: "2023",
      summary:
        "Cleaned and analysed 364,558 NYC 311 service requests to see how quickly the city closes different kinds of complaints.",
      points: [
        "Cleaned 53 columns of messy public data, handling missing values and duplicates.",
        "Engineered a request-closing-time feature and ranked complaint types by average closing time at each location.",
        "Used ANOVA and chi-square tests to check whether response times really differ across complaint types and locations.",
      ],
      tags: ["Python", "pandas", "SciPy", "Matplotlib"],
      links: [
        {
          label: "Code",
          url: "https://github.com/BeaconNicolas/Data_Science",
        },
      ],
    },
    {
      title: "House Price Feature Engineering",
      category: "Analytics",
      context: "Deviare",
      year: "2023",
      summary:
        "Prepared a housing dataset of 1,460 homes and 81 variables for predicting sale price.",
      points: [
        "Treated missing values and measured the skewness and distribution of every numeric variable.",
        "Picked significant variables with a correlation matrix and chi-square p-values.",
        "Separated numeric and categorical variables and recombined them into one dataset for modelling.",
      ],
      tags: ["Python", "pandas", "Seaborn", "SciPy"],
      links: [
        {
          label: "Code",
          url: "https://github.com/BeaconNicolas/Data_Science/tree/main/Deviare_Data%20Science_Projects",
        },
      ],
    },
    {
      title: "Comparative Study of Countries",
      category: "Analytics",
      context: "Deviare",
      year: "2023",
      summary:
        "An interactive Tableau dashboard comparing growth, income groups and trends over time across dozens of countries.",
      points: [
        "Combined growth maps, an income-group map and trend lines in one dashboard.",
        "Added filters for country, income group and year so viewers can explore it themselves.",
      ],
      tags: ["Tableau", "Dashboards", "Maps"],
      links: [
        {
          label: "Write-up",
          url: "https://github.com/BeaconNicolas/Data_Science/tree/main/Deviare_Data%20Science_Projects",
        },
      ],
    },
  ],

  // `tag` is the small category pill. Well-known tools (Python, Terraform, Docker…) get
  // their logo automatically; anything else gets a simple matching icon or none.
  skills: [
    {
      group: "Data science & optimisation",
      tag: "Optimisation & Modelling",
      items: [
        "Python",
        "Mixed-integer linear programming",
        "pandas",
        "NumPy",
        "SciPy",
        "Statistics & hypothesis testing",
        "R (regression)",
      ],
    },
    {
      group: "Machine learning",
      tag: "Machine Learning",
      items: [
        "scikit-learn",
        "Regression & classification",
        "Decision trees & random forests",
        "XGBoost",
        "K-Means & PCA",
        "Feature engineering",
      ],
    },
    {
      group: "Deep learning",
      tag: "Deep Learning",
      items: ["TensorFlow", "Keras", "CNNs", "RNNs", "Autoencoders"],
    },
    {
      group: "AWS",
      tag: "Cloud",
      items: ["Glue", "Lambda", "S3", "ECR", "IAM & cross-account roles", "Cloud9", "Multi-account architecture"],
    },
    {
      group: "DevOps & engineering",
      tag: "IaC & MLOps",
      items: ["Terraform", "CI/CD pipelines", "Docker", "Git", "Linux / WSL (Ubuntu)", "Angular"],
    },
    {
      group: "Data & visualisation",
      tag: "Data & BI",
      items: ["SQL", "MongoDB", "Tableau", "Matplotlib", "Seaborn", "Excel automation"],
    },
  ],

  education: [
    {
      title: "BSc in Applied Mathematics and Mathematical Statistics",
      org: "Rhodes University",
      period: "2020 – 2022",
    },
    {
      title: "BSc in Mathematical Science",
      org: "University of the Free State",
      period: "2018 – 2019",
    },
  ],

  certifications: [
    { title: "AWS Certified Cloud Practitioner", org: "Amazon Web Services" },
    {
      title: "Data and AI Master's Program",
      org: "Deviare",
      year: "2023",
      credential: "Dev-508-86",
    },
    { title: "Deep Learning with TensorFlow" },
    { title: "Introduction to Regression in R" },
    { title: "Intermediate Regression in R" },
    { title: "MongoDB for SQL Pros" },
  ],
};
