# Dataset Data Dictionary

## Source Information
- Dataset Name: Titanic - Machine Learning from Disaster (`train.csv`)
- Source Platform (Kaggle/data.gov.ph/UCI/OWID/etc.): Kaggle (mirrored on GitHub for download)
- Source URL: https://www.kaggle.com/c/titanic/data
- Download Date: 2026-05-16
- License: Kaggle competition dataset terms (used here for educational project work)

## Validation Summary
- Row Count: 891
- Column Count: 12
- Validation Script Output: `rows=891, cols=12` and `Dataset validation passed.`

## Column Definitions
| Column Name | Data Type | Description | Example | Notes |
|---|---|---|---|---|
| PassengerId | integer | Unique passenger identifier | 1 | No missing values |
| Survived | integer (0/1) | Survival target variable | 0 | 0 = did not survive, 1 = survived |
| Pclass | integer | Ticket class | 3 | 1 = upper, 2 = middle, 3 = lower |
| Name | string | Passenger full name | Braund, Mr. Owen Harris | No missing values |
| Sex | string | Passenger sex | male | Values are `male`/`female` |
| Age | float | Passenger age in years | 22.0 | 177 missing in raw; median-imputed in cleaned file |
| SibSp | integer | Number of siblings/spouses aboard | 1 | No missing values |
| Parch | integer | Number of parents/children aboard | 0 | No missing values |
| Ticket | string | Ticket number | A/5 21171 | No missing values |
| Fare | float | Ticket fare paid | 7.25 | No missing values |
| Cabin | string | Cabin identifier | C85 | 687 missing values retained |
| Embarked | string | Port of embarkation | S | 2 missing values retained |

## Cleaning Notes
- Missing value strategy: Median imputation for numeric columns; this resolved `Age` nulls.
- Outlier strategy: IQR clipping is implemented for `revenue`, `units_sold`, `profit_margin` if present; not applied because these columns are not in Titanic dataset.
- Normalization columns: Min-Max scaling is implemented for `revenue` and `units_sold` if present; not applied for Titanic dataset.
- Rows removed (if any): None (891 -> 891).

## Evidence Files
- Source screenshot: Pending (to be captured in docs/evidence/)
- Upload screenshot: N/A for local Phase 1 data step
- Supabase import screenshot: Pending (Phase 2)

## Phase 2 Database Import Asset
- Supabase-ready CSV (snake_case headers): `dataset/cleaned/titanic_train_cleaned_db.csv`
