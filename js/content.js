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
    role: "Data Science & Machine Learning",
    location: "Johannesburg, South Africa",
    availability: "Open to data science and analytics roles",
    tagline:
      "I build end-to-end data projects, from cleaning and statistical testing to machine-learning models and Tableau dashboards, and explain the results in plain language.",

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
    { value: "6", label: "end-to-end data science projects" },
    { value: "364k", label: "NYC 311 records cleaned and analysed" },
    { value: "Certified", label: "Data & AI Master's Program, 2023" },
  ],

  about: [
    "I'm a data science intern at Deviare in Johannesburg. Through Deviare's Data & AI Master's Program I covered statistics, Python for data science, machine learning, deep learning with Keras and TensorFlow, and Tableau, and delivered a hands-on project for each.",
    "I like taking a raw dataset and following it all the way through: cleaning, exploring, testing whether a pattern is real, building a model, and turning the findings into something a business can act on. I'm looking for a role where I can keep doing that on real problems.",
  ],

  // Shown next to the About text.
  facts: [
    { label: "Based in", value: "Johannesburg, South Africa" },
    { label: "Focus", value: "Machine learning, analytics, visualisation" },
    { label: "Currently", value: "Data Science Intern at Deviare" },
    { label: "Main tools", value: "Python, scikit-learn, TensorFlow, Tableau" },
  ],

  skills: [
    {
      group: "Languages & data",
      items: ["Python", "SQL", "pandas", "NumPy", "Jupyter", "Excel"],
    },
    {
      group: "Machine learning",
      items: [
        "scikit-learn",
        "Regression & classification",
        "Random Forest",
        "XGBoost",
        "K-Means clustering",
        "PCA",
        "GridSearchCV tuning",
      ],
    },
    {
      group: "Deep learning",
      items: ["TensorFlow", "Keras", "Dense neural networks", "Early stopping"],
    },
    {
      group: "Statistics",
      items: [
        "Exploratory data analysis",
        "Hypothesis testing",
        "ANOVA",
        "Chi-square",
        "Feature engineering",
        "VIF / multicollinearity",
      ],
    },
    {
      group: "Visualisation",
      items: ["Tableau", "Matplotlib", "Seaborn", "Plotly"],
    },
    {
      group: "Also worked with",
      items: ["MongoDB", "PySpark", "Flask APIs", "Web scraping", "Git & GitHub"],
    },
  ],

  // category must match one of the filter buttons: it is created automatically.
  projects: [
    {
      title: "Lending Club Loan Repayment Prediction",
      category: "Deep Learning",
      year: "2023",
      summary:
        "Predicted whether a borrower would fully repay their loan, using 9,578 Lending Club loan records.",
      points: [
        "Used chi-square tests to check which features relate to repayment, and VIF to catch multicollinearity.",
        "Compared Logistic Regression, a Random Forest tuned with GridSearchCV, and a deep Keras/TensorFlow network with early stopping.",
        "One-hot encoded loan purpose and scaled features before training.",
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
      year: "2023",
      summary:
        "Predicted how long a car spends on the test bench from about 380 anonymised configuration features. Shorter testing means lower CO₂ emissions.",
      points: [
        "Removed zero-variance features and label-encoded the categorical columns.",
        "Reduced dimensionality with PCA after standardising the data.",
        "Trained an XGBoost regression model to predict test time.",
      ],
      tags: ["Python", "XGBoost", "PCA", "scikit-learn"],
      links: [
        {
          label: "Write-up",
          url: "https://github.com/BeaconNicolas/Data_Science/tree/main/Deviare_Data%20Science_Projects",
        },
      ],
    },
    {
      title: "NYC 311 Customer Service Requests",
      category: "Data Analysis",
      year: "2023",
      summary:
        "Cleaned and analysed 364,558 NYC 311 service requests to see how quickly the city closes different kinds of complaints.",
      points: [
        "Cleaned 53 columns of messy public data, handling missing values and duplicates.",
        "Engineered a request-closing-time feature and ranked complaint types by average closing time per borough.",
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
      title: "Creating Cohorts of Songs",
      category: "Machine Learning",
      year: "2023",
      summary:
        "Grouped Rolling Stones tracks into cohorts using Spotify audio features, to support better song recommendations.",
      points: [
        "Removed duplicates and IQR outliers, then explored popularity, albums and audio features.",
        "Standardised the features and used PCA to reduce dimensionality.",
        "Chose the number of clusters, ran K-Means and described what defines each cohort.",
      ],
      tags: ["Python", "K-Means", "PCA", "scikit-learn"],
      links: [
        {
          label: "Code",
          url: "https://github.com/BeaconNicolas/Data_Science",
        },
      ],
    },
    {
      title: "House Price Feature Engineering",
      category: "Data Analysis",
      year: "2023",
      summary:
        "Prepared a housing dataset of 1,460 homes and 81 variables for predicting sale price.",
      points: [
        "Treated missing values and measured the skewness and distribution of every numeric variable.",
        "Picked significant variables with a correlation matrix and chi-square p-values.",
        "Split numeric and categorical variables and combined the significant ones into a model-ready dataset.",
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
      category: "Visualisation",
      year: "2023",
      summary:
        "Tableau dashboards and map visualisations comparing growth across dozens of countries.",
      points: [
        "Built map, bar and trend views so countries can be compared at a glance.",
        "Used colour and filters to highlight positive and negative growth.",
      ],
      tags: ["Tableau", "Dashboards", "Maps"],
      links: [
        {
          label: "Write-up",
          url: "https://github.com/BeaconNicolas/Data_Science/tree/main/Deviare_Data%20Science_Projects",
        },
      ],
    },
    {
      title: "Data Analytics Coursework",
      category: "Coursework",
      year: "2025",
      summary:
        "Hands-on modules across the analytics stack: Excel, VBA, Python, SQL, MongoDB, web scraping, Plotly and Leaflet, Tableau, machine learning, neural networks and PySpark.",
      points: [
        "Credit-risk classification with Logistic Regression on 77,536 loans.",
        "Crypto market clustering, a SQLAlchemy and Flask climate API, and PySpark home-sales analysis.",
      ],
      tags: ["SQL", "MongoDB", "PySpark", "JavaScript"],
      links: [
        {
          label: "Repository",
          url: "https://github.com/BeaconNicolas/2U_Projects",
        },
      ],
    },
  ],

  experience: [
    {
      role: "Data Science Intern",
      org: "Deviare",
      place: "Johannesburg",
      period: "2023 – Present",
      points: [
        "Completed Deviare's Data & AI Master's Program as part of the internship.",
        "Delivered six data science projects covering analysis, machine learning, deep learning and Tableau.",
      ],
    },
  ],

  education: [
    {
      title: "Data and AI Master's Program",
      org: "Deviare",
      period: "Issued September 2023",
      detail:
        "Statistics Essentials · Data Science with Python · Machine Learning · Deep Learning with Keras and TensorFlow · Tableau · Capstone Project",
      credential: "Certificate no. Dev-508-86",
    },
  ],
};
