import sys
import pandas as pd
import numpy as np


def clean_data(input_path: str, output_path: str) -> None:
    df = pd.read_csv(input_path)

    # Fill missing numeric values with median for robust imputation.
    for col in df.select_dtypes(include=[np.number]).columns:
        df[col] = df[col].fillna(df[col].median())

    # Clip outliers using IQR for common analytics fields.
    for col in [c for c in ["revenue", "units_sold", "profit_margin"] if c in df.columns]:
        q1, q3 = df[col].quantile([0.25, 0.75])
        iqr = q3 - q1
        lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
        df[col] = df[col].clip(lower=lower, upper=upper)

    # Min-Max scaling for selected numeric columns.
    for col in [c for c in ["revenue", "units_sold"] if c in df.columns]:
        min_v, max_v = df[col].min(), df[col].max()
        if max_v != min_v:
            df[f"{col}_scaled"] = (df[col] - min_v) / (max_v - min_v)

    df.to_csv(output_path, index=False)
    print(f"Cleaned dataset saved to: {output_path}")
    print(f"rows={len(df)}, cols={len(df.columns)}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        raise SystemExit("Usage: python clean_data.py <input_csv> <output_csv>")
    clean_data(sys.argv[1], sys.argv[2])
