import sys
import pandas as pd


def validate_dataset(path: str) -> None:
    df = pd.read_csv(path)
    rows, cols = df.shape
    print(f"rows={rows}, cols={cols}")

    if not (500 <= rows <= 1000):
        raise ValueError("Row count must be between 500 and 1000.")
    if cols < 5:
        raise ValueError("Dataset must have at least 5 columns.")

    print("Dataset validation passed.")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit("Usage: python validate_dataset.py <csv_path>")
    validate_dataset(sys.argv[1])
