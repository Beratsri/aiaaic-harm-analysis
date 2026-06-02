import pandas as pd
import numpy as np
import os
import re
from config import RAW_DATA_PATH, CLEAN_DATA_PATH, ensure_dirs

# Company mapping for normalization (case-insensitive keys)
COMPANY_MAPPING = {
    'facebook': 'Meta',
    'meta': 'Meta',
    'meta platforms': 'Meta',
    'meta platforms inc': 'Meta',
    'meta platforms, inc.': 'Meta',
    'google': 'Google',
    'alphabet': 'Google',
    'alphabet inc': 'Google',
    'alphabet inc.': 'Google',
    'google llc': 'Google',
    'google inc': 'Google',
    'google inc.': 'Google',
    'tiktok': 'ByteDance/TikTok',
    'bytedance': 'ByteDance/TikTok',
    'bytedance/tiktok': 'ByteDance/TikTok',
    'openai': 'OpenAI',
    'microsoft': 'Microsoft',
    'tesla': 'Tesla',
    'tesla inc': 'Tesla',
    'tesla inc.': 'Tesla',
    'tesla, inc.': 'Tesla',
    'amazon': 'Amazon',
    'amazon.com': 'Amazon',
    'amazon.com, inc.': 'Amazon',
    'amazon.com inc': 'Amazon',
    'apple': 'Apple',
    'apple inc': 'Apple',
    'apple inc.': 'Apple',
    'apple, inc.': 'Apple',
}

# Country mapping for normalization
COUNTRY_MAPPING = {
    'usa': 'United States',
    'us': 'United States',
    'u.s.': 'United States',
    'united states': 'United States',
    'united states of america': 'United States',
    'uk': 'United Kingdom',
    'u.k.': 'United Kingdom',
    'united kingdom': 'United Kingdom',
    'eu': 'EU',
    'european union': 'EU',
    'texas': 'United States',
    'california': 'United States',
    'new york': 'United States',
    'florida': 'United States',
    'washington': 'United States',
    'illinois': 'United States',
    'virginia': 'United States',
    'massachusetts': 'United States',
    'ohio': 'United States',
    'michigan': 'United States',
    'georgia': 'United States',
    'north carolina': 'United States',
    'pennsylvania': 'United States',
    'colorado': 'United States',
    'oregon': 'United States',
    'arizona': 'United States',
}

def load_raw_data(filepath: str) -> pd.DataFrame:
    """
    Load raw AIAAIC excel data, handling the multi-row headers.
    """
    # Load raw excel, sheet 'Incidents', header starts at row 1 (0-indexed)
    df = pd.read_excel(filepath, sheet_name='Incidents', header=[1, 2])
    return df

def clean_columns(df: pd.DataFrame) -> pd.DataFrame:
    """
    Map multi-index columns to a clean, flat schema.
    """
    flat_cols = []
    seen_names = {}
    
    for col in df.columns:
        lvl0 = str(col[0]).strip()
        lvl1 = str(col[1]).strip()
        
        # Determine the mapped column name
        mapped_name = None
        
        if 'AIAAIC ID' in lvl0:
            mapped_name = 'ID'
        elif 'Headline' in lvl0:
            mapped_name = 'Headline'
        elif 'Occurred' in lvl0:
            mapped_name = 'Year'
        elif 'Deployer' in lvl0:
            mapped_name = 'Deployer'
        elif 'Developer' in lvl0:
            mapped_name = 'Developer'
        elif 'System name' in lvl0:
            mapped_name = 'SystemName'
        elif 'Technology' in lvl0:
            mapped_name = 'Technology'
        elif 'Purpose' in lvl0:
            mapped_name = 'Purpose'
        elif 'News trigger' in lvl0:
            mapped_name = 'NewsTrigger'
        elif 'Ethical issue' in lvl0:
            mapped_name = 'EthicalIssue'
        elif 'Impacted area' in lvl0:
            if 'Jurisdiction' in lvl1:
                mapped_name = 'Country'
            elif 'Sector' in lvl1:
                mapped_name = 'Sector'
        elif 'External harm' in lvl0:
            if 'Individual' in lvl1:
                mapped_name = 'Harm_Individual'
            elif 'Societal' in lvl1:
                mapped_name = 'Harm_Societal'
            elif 'Environmental' in lvl1:
                mapped_name = 'Harm_Environmental'
        elif 'Consequence' in lvl0:
            mapped_name = 'Consequence'
        elif 'Response' in lvl0:
            mapped_name = 'Response'
        elif 'Summary' in lvl0:
            mapped_name = 'Summary'
        
        # If no mapping was found, fallback to combined representation
        if mapped_name is None:
            mapped_name = f"{lvl0}_{lvl1}"
            
        # Deduplicate names by adding numeric suffix
        if mapped_name in seen_names:
            seen_names[mapped_name] += 1
            mapped_name = f"{mapped_name}{seen_names[mapped_name]}"
        else:
            seen_names[mapped_name] = 1
            
        flat_cols.append(mapped_name)
        
    df.columns = flat_cols
    
    # Keep only relevant columns and discard any duplicates or extra columns (like Summary2)
    relevant_cols = [
        'ID', 'Headline', 'Year', 'Deployer', 'Developer', 'SystemName',
        'Technology', 'Purpose', 'NewsTrigger', 'EthicalIssue', 'Country',
        'Sector', 'Harm_Individual', 'Harm_Societal', 'Harm_Environmental',
        'Consequence', 'Response', 'Summary', 'Summary2'
    ]
    
    # Filter to only columns that are in flat_cols
    cols_to_keep = [col for col in relevant_cols if col in df.columns]
    df = df[cols_to_keep]
    
    return df

def parse_multivalue(value, sep: str = ';') -> list:
    """
    Parse a string value containing multiple semi-colon separated items.
    Returns a cleaned list of strings.
    """
    if pd.isna(value):
        return []
    items = str(value).split(sep)
    cleaned = []
    for item in items:
        item_strip = item.strip()
        # Remove multiple whitespaces or newline markers
        item_strip = re.sub(r'\s+', ' ', item_strip)
        if item_strip and item_strip.lower() not in ['nan', 'none', 'null', '']:
            cleaned.append(item_strip)
    return cleaned

def normalize_company_names(value: str) -> str:
    """
    Normalize individual company name using company mapping.
    """
    if pd.isna(value):
        return value
    
    # Clean the multi-values
    parts = parse_multivalue(value)
    normalized_parts = []
    for part in parts:
        part_lower = part.lower().strip()
        # Check direct mapping
        matched = False
        for k, v in COMPANY_MAPPING.items():
            if k == part_lower or part_lower.startswith(k + " ") or part_lower.endswith(" " + k):
                normalized_parts.append(v)
                matched = True
                break
        if not matched:
            normalized_parts.append(part)
            
    # De-duplicate normalized values while preserving order
    seen = set()
    deduped_parts = []
    for part in normalized_parts:
        if part not in seen:
            seen.add(part)
            deduped_parts.append(part)
            
    return "; ".join(deduped_parts) if deduped_parts else np.nan

def normalize_countries(value: str) -> str:
    """
    Normalize individual country name.
    """
    if pd.isna(value):
        return value
        
    parts = parse_multivalue(value)
    normalized_parts = []
    for part in parts:
        part_lower = part.lower().strip()
        # Direct mapping
        if part_lower in COUNTRY_MAPPING:
            normalized_parts.append(COUNTRY_MAPPING[part_lower])
        else:
            normalized_parts.append(part)
            
    # De-duplicate
    seen = set()
    deduped_parts = []
    for part in normalized_parts:
        if part not in seen:
            seen.add(part)
            deduped_parts.append(part)
            
    return "; ".join(deduped_parts) if deduped_parts else np.nan

def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Applies all cleaning, parsing, and normalization steps.
    """
    # 1. Remove rows where ID is missing
    df = df.dropna(subset=['ID']).copy()
    
    # 2. Trim string column contents and handle year column
    # Year: extract digit sequences, parse to float, then convert to nullable Int64
    def parse_year(val):
        if pd.isna(val):
            return np.nan
        val_str = str(val).strip()
        # Search for a 4 digit year
        match = re.search(r'\b(20\d{2}|19\d{2})\b', val_str)
        if match:
            return int(match.group(1))
        # Fallback to general digit parsing
        digits = re.sub(r'\D', '', val_str)
        if len(digits) >= 4:
            return int(digits[:4])
        return np.nan

    df['Year'] = df['Year'].apply(parse_year).astype('Int64')
    
    # 3. Trim all string columns
    str_cols = df.select_dtypes(include=['object']).columns
    for col in str_cols:
        def safe_strip_val(x):
            if isinstance(x, (list, np.ndarray, pd.Series)):
                return "; ".join([str(i).strip() for i in x if pd.notna(i)])
            if isinstance(x, str):
                return x.strip()
            if pd.isna(x):
                return x
            return str(x).strip()
        df[col] = df[col].apply(safe_strip_val)
        
    # 4. Normalize Companies (Developer and Deployer)
    if 'Developer' in df.columns:
        df['Developer'] = df['Developer'].apply(normalize_company_names)
    if 'Deployer' in df.columns:
        df['Deployer'] = df['Deployer'].apply(normalize_company_names)
        
    # 5. Normalize Countries
    if 'Country' in df.columns:
        df['Country'] = df['Country'].apply(normalize_countries)
        
    # 6. Drop empty/summary columns that are not part of the dataset spec
    # Drop Harm_Environmental as it's 98.4% missing per spec and Summary2 as requested
    if 'Harm_Environmental' in df.columns:
        df = df.drop(columns=['Harm_Environmental'])
    if 'Summary2' in df.columns:
        df = df.drop(columns=['Summary2'])
        
    return df

def main():
    ensure_dirs()
    print(f"Loading raw data from: {RAW_DATA_PATH}")
    df_raw = load_raw_data(RAW_DATA_PATH)
    print(f"Raw data shape: {df_raw.shape}")
    
    df_clean = clean_columns(df_raw)
    df_clean = clean_dataframe(df_clean)
    
    print(f"Cleaned data shape: {df_clean.shape}")
    df_clean.to_csv(CLEAN_DATA_PATH, index=False)
    print(f"Cleaned data saved to: {CLEAN_DATA_PATH}")

if __name__ == "__main__":
    main()
