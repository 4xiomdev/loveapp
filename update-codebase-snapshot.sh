#!/bin/bash

# Create the output file
output_file="CODEBASE_SNAPSHOT.md"

# Clear the existing file if it exists
echo "# Codebase Snapshot" > "$output_file"
echo "\nGenerated on: $(date)\n" >> "$output_file"

# Add directory tree structure
echo "## Directory Structure" >> "$output_file"
echo "\`\`\`" >> "$output_file"
tree -I 'node_modules|build|dist|.git|coverage' >> "$output_file"
echo "\`\`\`" >> "$output_file"

# Add file contents
echo -e "\n## File Contents\n" >> "$output_file"

# Find all files excluding node_modules, .git, etc.
find . -type f \
    ! -path "*/node_modules/*" \
    ! -path "*/.git/*" \
    ! -path "*/build/*" \
    ! -path "*/dist/*" \
    ! -path "*/coverage/*" \
    ! -name "*.log" \
    ! -name "*.lock" \
    ! -name "package-lock.json" \
    ! -name ".DS_Store" \
    -print0 | while IFS= read -r -d '' file; do
    
    # Skip the snapshot file itself
    if [[ "$file" == "./$output_file" ]]; then
        continue
    fi
    
    # Remove the leading ./
    clean_filename="${file#./}"
    
    echo -e "\n### $clean_filename\n" >> "$output_file"
    echo "\`\`\`" >> "$output_file"
    cat "$file" >> "$output_file"
    echo "\`\`\`" >> "$output_file"
done

echo "Codebase snapshot has been generated in $output_file" 