# AIAAIC ML-Enriched AI Incident Analysis

Berat Sarı - 24018025 · [https://github.com/Beratsri/aiaaic-harm-analysis](https://github.com/Beratsri/aiaaic-harm-analysis)

**Abstract**  
This study uses machine learning to fill the gaps in the AI, Algorithmic, and Automation Incidents and Controversies (AIAAIC) Repository. AIAAIC is one of the most important open registries of AI failures, but it is hard to use for research because many fields are empty - especially the fields that record individual and societal harm (about 60–64% missing). We train multi-label classifiers (One-vs-Rest Logistic Regression with TF-IDF features) to predict these missing harm labels. We also build a new "Affected Party" taxonomy and a model that maps which groups of people are harmed by AI systems. Tests on the enriched dataset show that AI harms cluster strongly in certain industry sectors and demographic groups (p < 0.0001). We also show that a small set of repeat developers dominates the incident list, and that most companies never publicly respond to the incidents they cause.

---

## 1. INTRODUCTION

### 1.1 AI Ethics and Incident Databases
As AI systems move into everyday infrastructure, their ability to cause real harm grows. AI incident databases respond to this by keeping a public record of failures. They work as early-warning systems: developers, policymakers, and auditors can study past incidents to see which patterns of failure lead to lawsuits, reputation damage, and physical or psychological harm.

### 1.2 AIAAIC Repository
The AIAAIC Repository is one of the largest public collections of AI controversies: over 2,200 incidents going back to 2008, covering everything from exam-grading algorithms to deepfakes. The data is crowdsourced, and that comes at a cost - many records are incomplete. The most important fields, who was harmed and what it cost society, are often left blank. This makes statistical analysis on the raw data difficult.

### 1.3 Research Question
This project asks one main question:  
*Can machine learning text classification fill the data gaps in AI incident databases - and once the gaps are filled, what does the data tell us about which groups and sectors carry the most AI harm?*

### 1.4 Contributions
This study makes four contributions:
1. **Pipeline Enrichment:** We build a text-classification pipeline that fills in the missing `Harm_Individual` and `Harm_Societal` labels, making older incomplete records usable again.
2. **Affected Party Taxonomy:** We introduce a new `Affected Party` taxonomy. We hand-labelled about 300 incidents during development, used them to build a keyword-matching rule that labelled the full dataset, and then trained a multi-label classifier on those labels.
3. **Systemic Auditing:** We run hypothesis tests on the enriched dataset, which give statistical evidence of systemic injustice and developer concentration.
4. **Interactive Research Atlas:** We publish the enriched dataset and all findings as a public eight-page interactive dashboard, where every incident, model score, and accountability score can be checked.

---

## 2. DATA AND METHODOLOGY

### 2.1 AIAAIC Data Schema
The raw dataset is a single spreadsheet sheet, `Incidents`, with 2,247 rows. The Excel file has a double header row, which we map to a clean flat schema:
- `ID`: Unique identifier
- `Headline`: Incident title
- `Year`: Year of occurrence
- `Developer`: Organization(s) that built the system
- `Deployer`: Organization(s) that deployed the system
- `Technology`: Core technology type
- `Sector`: Affected industry sector
- `Harm_Individual` and `Harm_Societal`: Target classifications

### 2.2 Missing Value Analysis
A first look at the data shows large gaps:
- `Harm_Individual`: 64.0% missing
- `Harm_Societal`: 60.1% missing
- `Consequence` (Legal action): 74.3% missing
- `Response` (Corporate statement): 78.8% missing

These gaps are not random - well-known incidents get fuller records than obscure ones. That means running statistics directly on the raw data would give biased results.

### 2.3 Cleaning and Normalization
We merge different spellings of the same company into one name (for example, "Alphabet" and "Google LLC" both become "Google") and roll US states up to country level (for example, "Texas" becomes "United States"). Columns that hold several values separated by semicolons are split into lists, so the same incident is not counted twice.

### 2.4 ML Pipeline Design
For each incident we build one text input by joining the columns: `Headline | Technology | Sector | EthicalIssue | Purpose`. A TF-IDF vectorizer turns this text into features using word n-grams `(1, 2)`. Since one incident can cause several types of harm at once, we treat this as a multi-label classification problem. We train a `OneVsRestClassifier` around Logistic Regression with L2 regularization and balanced class weights, which helps with rare labels.

### 2.5 Affected Party Labeling (Manual Seed + Weak Supervision)
The raw AIAAIC data has no `Affected Party` field at all, so we created one in two steps. We first defined a taxonomy of 12 groups (Workers, Minorities, Children, Women, LGBTQ, Disabled, Patients, Students, Citizens, Artists, Consumers, Activists). Step one: we hand-labelled about 300 incidents during development. This sample shaped the taxonomy and showed us which words point to which group. Step two: we turned those words into a keyword-matching rule and used it to assign a primary and secondary affected party to all 2,247 incidents - an approach known as "weak supervision". We then trained a multi-label classifier (TF-IDF + One-vs-Rest Logistic Regression) on these keyword-based labels, and its predictions became the final `AffectedParty` field for every incident. To be clear: these labels come from a heuristic, not from human ground truth. The 300 hand-labelled incidents anchor the taxonomy; they are not an independent test set.

---

## 3. RESULTS

### 3.1 ML Model Performance
We evaluated each classifier on an 80/20 train/test split.
- **Harm_Individual Model:** Micro F1: 0.611, Macro F1: 0.525 (the gap shows that rare classes are harder). The most common categories (Privacy loss, IP/copyright loss) scored above 0.88 F1.
- **Harm_Societal Model:** Micro F1: 0.584, Macro F1: 0.518.
- **Affected Party Model:** Micro F1: 0.644, Macro F1: 0.579. Important: as Section 2.5 explains, this model is tested against the keyword-based labels. So these scores measure how well the model matches the keyword rule - not how well it matches human judgment.

These scores are normal for multi-label text classification on crowdsourced data. They are not perfect, but they are good enough to read large-scale patterns from the data.

### 3.2 Hypothesis Testing

#### H1: Algorithmic Injustice (Sector vs Affected Party)
We run a chi-square test of independence between `Sector` and `AffectedParty`.
- **Result:** $\chi^2 = 6{,}269.1$, $p < 0.0001$.
- **Interpretation:** We reject the null hypothesis. AI harms are concentrated, not spread evenly. For example, workers are harmed most in the "Logistics and Gig Economy" sector, while children and students face high incident rates in "Education" and "Media/Social Platforms."
- **Caveats:** Two things inflate this number, so it should not be read as a clean significance test. First, the `AffectedParty` labels are model predictions, and the model's input text includes the `Sector` field - so the two tested variables are partly linked by construction. Second, incidents with several sectors or several affected parties are split into one row per pair, so one incident can be counted several times, which breaks the independence assumption of the chi-square test. We therefore read this result as strong descriptive evidence of sector–group concentration, not as exact inference. The sector × group heatmap shows the same pattern.

#### Finding 2: Repeat Offenders (Developer Concentration)
We count how often each developer appears across the 2,247 incidents.
- **Result:** The top 5 companies (OpenAI, Google, Meta, Amazon, Tesla) account for 28.3% of all documented incidents. OpenAI leads with 236 incidents (10.5%), followed by Google (6.3%), Meta (4.9%), Amazon (3.3%), and Tesla (3.3%).
- **Interpretation:** AI controversies are heavily concentrated in a small group of dominant developers, which supports concerns about corporate unaccountability.

#### Finding 3: Corporate Accountability Index
From the AIAAIC `Response` field we derive a response quality score (0–4) for each organisation with at least five recorded incidents. A score of 0 means no documented response; 4 means a public apology or a similar corrective action.
- **Result:** Across all tracked companies, the average silence rate is above 78%. A small group of organisations consistently scores 2.0 or higher, while most cluster near 0.
- **Interpretation:** Responding to an AI incident is the exception, not the rule. Companies with many incidents are not more likely to respond - in several cases, more incidents go together with more silence, which suggests that dominant developers are insulated from reputational pressure.

---

## 4. DISCUSSION

### 4.1 Implications for AI Ethics
Our findings back up, with numbers, what AI ethics scholars have long argued: AI systems reinforce existing power structures instead of disrupting them. When large developers deploy models with little oversight, the harms - privacy violations, discrimination, financial loss, job loss - land hardest on consumers and minority groups. In short, the benefits and the harms of AI are distributed unfairly. Voluntary accountability is also not working: most incidents get no corporate response (78.8% missing in `Response`) and no formal consequence (74.3% missing in `Consequence`). This supports the case for binding rules and independent oversight rather than self-regulation.

### 4.2 Limitations of ML Models
Model predictions are proxy signals, not ground truth. They are useful for tracking broad trends, but single predictions can be wrong - TF-IDF can confuse incidents that share vocabulary but describe different harms.

---

## 5. LIMITATIONS

1. **Language Bias:** AIAAIC mostly covers English-language media, so the data leans toward Western developers and countries (mainly the United States and the United Kingdom).
2. **Crowdsourcing Quality:** The database depends on media coverage. Incidents that never reach the press are simply not in the data.
3. **Weak Supervision of Affected-Party Labels:** The affected-party labels come from a keyword rule seeded by ~300 hand-labelled incidents - not from full human annotation. The reported F1 measures agreement with that rule, and both the rule and the hand labels inherit whatever biases the media coverage has. Without a separately hand-labelled test set, true label quality cannot be measured.
4. **Statistical Caveats on H1:** As explained in Section 3.2, the chi-square value is inflated: the affected-party model uses `Sector` as an input, and multi-valued records are counted more than once. The sectoral-concentration finding is descriptive, not confirmatory.

---

## 6. CONCLUSION

We enriched the AIAAIC database with machine learning, filling the main gaps in individual and societal harm labels and creating a first Affected Party baseline. The enriched data shows that AI harm is not evenly distributed: it concentrates in specific sectors, falls on specific groups, and traces back to a small set of dominant developers - most of whom never publicly respond when an incident occurs. All data, models, and findings are open for inspection in the interactive dashboard.

---

## REFERENCES

1. AIAAIC (2024). *AIAAIC Repository.* https://www.aiaaic.org/aiaaic-repository

---

## LINKS

- Video on YouTube: [https://www.youtube.com/watch?v=U1CDrEFKws8](https://www.youtube.com/watch?v=U1CDrEFKws8)
- Video on Drive: [https://drive.google.com/file/d/178NJuxaUbM-crRNzc5sRqfmJxpEsdt6U/view?usp=sharing](https://drive.google.com/file/d/178NJuxaUbM-crRNzc5sRqfmJxpEsdt6U/view?usp=sharing)
