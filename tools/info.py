# info.py
# This script fetches anime information from the Jikan API and creates an info.ini file in each directory.
# Please run: pip install requests configparser tqdm
# Then run the script with: python info.py

import requests
import configparser
import os
from datetime import datetime
import time
from tqdm import tqdm
import sys

# API rate limit settings
RATE_LIMIT_DELAY = 1  # seconds between API calls

def create_slug(title):
    """Create a slug from the anime title."""
    return title.lower().replace(" ", "-").replace(":", "").replace("'", "").replace(",", "").replace(".", "")

def fetch_anime_info(anime_name):
    """Fetch anime info from Jikan API with rate limiting."""
    # Clean up the search term by removing common suffixes and file extensions
    search_term = anime_name.lower()
    for suffix in ['-', 'season', 's1', 's2', 'tv']:
        search_term = search_term.replace(suffix, ' ')
    search_term = search_term.strip()
    
    api_url = f"https://api.jikan.moe/v4/anime?q={search_term}&limit=1"
    
    try:
        response = requests.get(api_url)
        if response.status_code == 429:  # Too Many Requests
            retry_after = int(response.headers.get('Retry-After', RATE_LIMIT_DELAY))
            tqdm.write(f"Rate limited. Waiting {retry_after} seconds...")  # Use tqdm.write instead of print
            time.sleep(retry_after)
            return fetch_anime_info(anime_name)
            
        if response.status_code == 200:
            data = response.json()
            if data.get("data"):
                time.sleep(RATE_LIMIT_DELAY)
                return data["data"][0]
            else:
                tqdm.write(f"No results found for: {anime_name}")
                return None
        else:
            tqdm.write(f"Error: {response.status_code} - {response.reason}")
            return None
            
    except requests.exceptions.RequestException as e:
        tqdm.write(f"Network error occurred: {e}")
        return None

def clean_description(description):
    """Clean and format the description field."""
    if description:
        return ' '.join(description.split()).replace('[Written by MAL Rewrite]', '').strip()
    return "No description available."

def create_info_ini(anime_data, directory_path):
    """Create an info.ini file from anime data."""
    config = configparser.ConfigParser()
    config.optionxform = str  # Preserve key casing
    config['General'] = {
        'Title': anime_data.get('title_english', anime_data.get('title')),
        'Type': anime_data.get('type', 'Unknown'),
        'Genre': ", ".join([genre['name'] for genre in anime_data.get('genres', [])]),
        'Description': clean_description(anime_data.get('synopsis', '')),
        'Mal_ID': str(anime_data.get('mal_id', 'N/A')),
        'Date_Added': datetime.now().strftime('%Y-%m-%d')
    }
    
    # Use the directory path directly instead of creating a slug-based path
    ini_path = os.path.join(directory_path, 'info.ini')
    
    try:
        with open(ini_path, 'w', encoding='utf-8') as configfile:
            config.write(configfile)
            print(f"info.ini created/updated in: {directory_path}")
    except FileNotFoundError:
        print(f"Error: Could not create info.ini in {directory_path}")

def clear():
    os.system('cls' if os.name == 'nt' else 'clear')

def print_main():
    clear()
    print("Anime Info Generator")
    print("===================")

def walk_directory(directory):
    """Walk through immediate subdirectories and create/update info.ini files."""
    subdirs = [entry for entry in os.scandir(directory) if entry.is_dir()]
    
    # Modified progress bar format to stay on one line
    with tqdm(total=len(subdirs), 
             desc="Processing", 
             bar_format='{desc}: {percentage:3.0f}%|{bar}| {n_fmt}/{total_fmt} [{elapsed}<{remaining}] {postfix}',
             ncols=100,  # Fixed width
             position=0,  # Keep at the same position
             leave=True  # Keep the final result
             ) as pbar:
        
        success_count = 0
        failed_count = 0
        skipped_count = 0
        
        for entry in subdirs:
            # Update postfix instead of description for current file
            pbar.set_postfix_str(entry.name[:30])
            
            # Skip hidden directories
            if entry.name.startswith('.'):
                skipped_count += 1
                print_main()
                pbar.update(1)
                continue
                
            anime_data = fetch_anime_info(entry.name)
            if anime_data:
                try:
                    create_info_ini(anime_data, entry.path)
                    success_count += 1
                    print_main()
                except Exception as e:
                    tqdm.write(f"Error processing {entry.name}: {e}")
                    failed_count += 1
                    print_main()
            else:
                failed_count += 1
                print_main()
            
            pbar.update(1)
            
        
        # Clear the progress bar before printing summary
        pbar.clear()
        
        # Print summary with more details
        tqdm.write("\nProcessing Complete!")
        tqdm.write("===================")
        tqdm.write(f"✓ Successfully processed: {success_count}")
        tqdm.write(f"✗ Failed: {failed_count}")
        tqdm.write(f"- Skipped: {skipped_count}")

def main():
    print("Anime Info Generator")
    print("===================")
    
    try:
        walk_directory(".")
    except KeyboardInterrupt:
        print("\nProcess interrupted by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\nAn unexpected error occurred: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
