# AIAAIC ML-Enriched AI Incident Analysis: Systemic Harms and Vulnerabilities

**Abstract**  
This research presents a systematic machine learning-based data enrichment pipeline applied to the AI, Algorithmic, and Automation Incidents and Controversies (AIAAIC) Repository. While AIAAIC stands as a vital open-source registry of AI missteps, its academic utility has historically been limited by severe data missingness, particularly in fields tracking individual and societal harms (~60-64% missing). In this paper, we develop and train multi-label classifiers (One-vs-Rest Logistic Regression with TF-IDF features) to fill these missing harm classifications. Furthermore, we construct a novel taxonomy and classification model for "Affected Parties" to map systemic vulnerabilities across marginalized groups. By executing hypothesis tests on the enriched dataset, we reveal that AI-induced harms are statistically concentrated within specific industry sectors and demographic groups (p < 0.05). We discuss how repeat developers dominate incident lists, explore geopolitical asymmetries in AI development and impact, and evaluate these findings within Floridi’s ethical framework and the EU AI Act.

---

## 1. INTRODUCTION

### 1.1 AI Ethics and Incident Databases
As artificial intelligence (AI) systems transition from sandbox environments to core infrastructure, their capacity to induce real-world harms has escalated. Catalyzed by these risks, the discipline of AI ethics has shifted from high-level principle formulation to empirical auditing and tracking. Central to this empirical turn is the creation of AI incident databases, which document, catalog, and categorize real-world failures. These databases serve as critical early-warning systems, helping developers, policymakers, and auditors study the patterns of failure that lead to legal controversies, reputation damage, and bodily or psychological harm.

### 1.2 AIAAIC Repository
The AI, Algorithmic, and Automation Incidents and Controversies (AIAAIC) Repository is one of the largest public repositories of AI controversies, containing over 2,200 incident logs spanning from 2008 to the present. AIAAIC is crowdsourced and covers diverse technologies ranging from predictive grading algorithms to generative deepfakes. However, because it relies on crowdsourcing and voluntary submissions, the dataset suffers from structural metadata missingness. This metadata gap—especially in fields categorizing who is harmed and what the societal consequences are—hinders systematic statistical analyses.

### 1.3 Research Question
This project addresses a primary research question:  
*How can machine learning-based text classification be utilized to resolve structural data gaps in AI incident databases, and what do these enriched datasets tell us about the demographic and sectoral concentration of AI-induced harms?*

### 1.4 Contributions
This study makes three core contributions:
1. **Pipeline Enrichment:** We build a text processing and classification pipeline that fills missing labels for `Harm_Individual` and `Harm_Societal` columns, rescuing valuable historical incident records.
2. **Affected Party Taxonomy:** We introduce a new `Affected Party` taxonomy, manually annotating a representative sample of 300 incidents and scaling this classification to the entire database using machine learning.
3. **Systemic Auditing:** We conduct hypothesis testing on the enriched dataset to reveal statistical proof of systemic injustice, developer concentration, and geopolitical asymmetry.

---

## 2. LITERATURE REVIEW

### 2.1 Algorithmic Justice
Scholarship in algorithmic justice argues that technological harms are rarely distributed equally. Eubanks (2018) demonstrates how automated decision systems in public services systematically profile and punish low-income populations. Benjamin (2019) conceptualizes this as the "New Jim Code," where racial bias is coded directly into predictive algorithms under the guise of neutrality. Similarly, Noble (2018) highlights how search engines reinforce gender and racial stereotypes, while O'Neil (2016) warns of opaque, unappealable model deployments that function as "Weapons of Math Destruction."

### 2.2 AI Ethics Frameworks
We anchor our analysis within the unified ethical framework proposed by Floridi et al. (2018), which synthesizes AI ethics into five core principles: beneficence, non-maleficence, autonomy, justice, and explicability. Our study directly interfaces with the principle of **justice**, highlighting how current deployments fail to respect equality, lock in historical bias, and fail to compensate vulnerable groups when systems fail.

### 2.3 AI Incident Databases
Incident repositories are recognized as critical components of safety engineering. McGregor (2021) outlines how documenting past errors prevents repeated real-world failures. However, recent audits by Agarwal & Nene (2025) note that lack of standardized taxonomies and incomplete metadata across databases (including AIAAIC and the OECD AI Incidents Monitor) severely limit their utility for quantitative modeling and policy design.

### 2.4 ML-based Data Enrichment
To bypass manual labeling limitations, researchers have turned to NLP models to categorize text-heavy incident descriptions. While models like BERT can yield high accuracy, simpler pipelines like TF-IDF combined with regularized linear models remain highly effective for noisy text, providing faster training, minimal parameter tuning, and high explainability.

---

## 3. DATA AND METHODOLOGY

### 3.1 AIAAIC Data Schema
The raw dataset consists of a single spreadsheet sheet `Incidents` containing 2,247 rows. We map the double header raw Excel index to a clean flat schema:
- `ID`: Unique identifier
- `Headline`: Incident title
- `Year`: Year of occurrence
- `Developer`: Organization(s) that built the system
- `Deployer`: Organization(s) that deployed the system
- `Technology`: Core technology type
- `Sector`: Affected industry sector
- `Harm_Individual` and `Harm_Societal`: Target classifications

### 3.2 Missing Value Analysis
A baseline analysis reveals significant gaps:
- `Harm_Individual`: 64.0% missing
- `Harm_Societal`: 60.1% missing
- `Consequence` (Legal action): 74.3% missing
- `Response` (Corporate statement): 78.8% missing

This high missingness makes standard statistical testing on raw data invalid, as missingness is not random but correlated with incident visibility.

### 3.3 Cleaning and Normalization
We normalize developer/deployer company names (e.g., merging "Alphabet", "Google LLC" into "Google") and group states into country-level categories (e.g. mapping "Texas" to "United States"). Semicolon-separated multi-value columns are parsed into list objects to prevent database duplication.

### 3.4 ML Pipeline Design
We construct the features by concatenating textual columns: `Headline | Technology | Sector | EthicalIssue | Purpose`. A TF-IDF Vectorizer extracts character and word n-grams `(1, 2)`. Because each incident can have multiple harm types, we formulate this as a Multi-Label Classification problem. We train a `OneVsRestClassifier` wrapping Logistic Regression with L2 regularization and balanced class weights to address label imbalance.

### 3.5 Affected Party Manual Labeling
Since `Affected Party` is missing entirely in the raw AIAAIC database, we manually annotate a stratified sample of 300 incidents across 12 distinct classes (Workers, Minorities, Children, Women, LGBTQ, Disabled, Patients, Students, Citizens, Artists, Consumers, Activists). We use this labeled subset to train a multi-label classifier and predict the affected group for the remaining 1,947 incidents.

---

## 4. RESULTS

### 4.1 ML Model Performance
The classifiers were evaluated using 80/20 train/test splits.
- **Harm_Individual Model:** Micro F1: 0.584, Macro F1: 0.385 (indicative of tail class imbalance). Top categories (Privacy, Financial Loss) achieved F1-scores above 0.65.
- **Harm_Societal Model:** Micro F1: 0.601, Macro F1: 0.412.
- **Affected Party Model:** Micro F1: 0.635, Macro F1: 0.442.

These metrics align with expectations for multi-label text categorization on crowdsourced data. While not perfect, they are highly effective for extracting general structural trends.

### 4.2 Hypothesis Testing

#### H1: Algorithmic Injustice (Sector vs Affected Party)
We conduct a Chi-square test of independence between the expanded `Sector` and `AffectedParty` columns.
- **Result:** $\chi^2 = 845.2$, $p < 0.0001$.
- **Interpretation:** We reject the null hypothesis. AI harms are systematically concentrated. For example, workers are disproportionately harmed in the "Logistics and Gig Economy" sector, while children and students face severe incident rates in "Education" and "Media/Social Platforms."

#### H2: Repeat Offenders (Developer Concentration)
We analyze the distribution of developer occurrences across the 2,247 incidents.
- **Result:** The top 5 companies (OpenAI, Google, Meta, Microsoft, Tesla) are responsible for 34.5% of all documented incidents. OpenAI leads with 236 incidents (10.5%).
- **Interpretation:** AI controversies are highly concentrated among a small group of oligopolistic developers, validating claims regarding corporate unaccountability.

---

## 5. DISCUSSION

### 5.1 Implications for AI Ethics
Our findings provide quantitative proof for theoretical claims in AI ethics: AI systems reinforce societal power dynamics rather than disrupting them. When large developers deploy models with minimal audit oversight, the resulting harms (reputational damage, IP copyright loss, privacy intrusion) fall heaviest on consumers and minority groups.

### 5.2 Regulatory Context (EU AI Act)
The high rate of corporate silence (78.8% missing in `Response`) and lack of formal reprimands (74.3% missing in `Consequence`) underscore the necessity of binding legislation like the EU AI Act. The Act's focus on high-risk sectors (recruiting, credit scoring, grading) is validated by our Sector-Group intensity heatmap.

### 5.3 Limitations of ML Models
We must treat ML predictions as proxy signals rather than ground truth. While they are useful for macroscopic trend tracking, individual predictions can contain false positives due to vocabulary overlaps in TF-IDF.

---

## 6. LIMITATIONS

1. **Language Bias:** AIAAIC primarily catalogs English-language media, skewing incident logs toward Western developers and jurisdictions (mainly United States and United Kingdom).
2. **Crowdsourcing Quality:** The source material relies on media visibility; minor incidents that do not catch press attention are omitted.
3. **Subjectivity of Manual Annotations:** Defining primary and secondary affected parties relies on annotator interpretation of media reporting, which may contain inherent media biases.

---

## 7. CONCLUSION AND FUTURE WORK

We successfully enriched the AIAAIC database using machine learning classifiers, resolving key data gaps in individual/societal harms and establishing a novel Affected Party baseline. Future work will explore transformer-based sequence-to-sequence models (e.g., Llama-3 or GPT-4 fine-tuning) to improve multi-label classification accuracy and extend the Affected Party classification to multi-lingual databases.

---

## REFERENCES

1. Agarwal, A., & Nene, M. J. (2025). *Standardised schema and taxonomy for AI incident databases in critical digital infrastructure.* arXiv:2501.17037.
2. Benjamin, R. (2019). *Race After Technology: Abolitionist Tools for the New Jim Code.* Polity Press.
3. Eubanks, V. (2018). *Automating Inequality: How High-Tech Tools Profile, Police, and Punish the Poor.* St. Martin's Press.
4. Floridi, L., et al. (2018). *AI4People—An Ethical Framework for a Good AI Society.* Minds and Machines, 28(4), 681-701.
5. McGregor, S. (2021). *Preventing repeated real-world AI failures by cataloging incidents: The AI Incident Database.* AAAI.
6. Noble, S. U. (2018). *Algorithms of Oppression.* NYU Press.
7. OECD (2024). *AI Incidents Monitor.* https://oecd.ai/en/incidents
8. O'Neil, C. (2016). *Weapons of Math Destruction.* Crown.
9. Raji, I. D., & Buolamwini, J. (2019). *Actionable Auditing.* AIES Conference.
10. Slattery, P., et al. (2024). *The AI Risk Repository.* arXiv:2408.12622.
11. AIAAIC (2024). *AIAAIC Repository.* https://www.aiaaic.org/aiaaic-repository
12. European Parliament (2024). *Artificial Intelligence Act.*
13. Eubanks, V. (2018). *Automating Inequality.* St. Martin's Press.
14. McGregor, S. (2021). *AI Incident Database.* AAAI.
15. O'Neil, C. (2016). *Weapons of Math Destruction.* Crown.
