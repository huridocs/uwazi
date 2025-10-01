#!/bin/bash

# Script to resolve merge conflicts by keeping ESM imports (HEAD version)
# This script resolves conflicts in files where we want to keep our ESM migration changes

echo "Resolving merge conflicts by keeping ESM imports..."

# List of files with conflicts that need ESM imports preserved
conflict_files=(
    "app/api/core/application/TemplateUpdateDenormalizeEntitiesBatch.ts"
    "app/api/core/domain/template/NestedProperty.ts"
    "app/api/core/domain/template/propertyCreatorService/PropertyCreatorServiceStrategy.ts"
    "app/api/core/infrastructure/mongodb/template/Mapper.ts"
    "app/api/search.v2/buildQuery.ts"
    "app/api/search.v2/specs/sorting.spec.ts"
    "app/api/templates.v2/contracts/TemplatesDataSource.ts"
    "app/api/templates.v2/database/MongoTemplatesDataSource.ts"
    "app/api/templates.v2/model/Template.ts"
    "app/api/templates/routes.ts"
    "app/api/templates/specs/extractedMetadataFunctions.spec.ts"
    "app/api/templates/templateUpdateDenormalizeUseCase.ts"
    "app/api/templates/templates.ts"
    "app/queueRegistry.ts"
    "app/react/Routes.tsx"
    "app/react/V2/Components/CodeEditor/CodeEditorComponent.tsx"
    "app/react/V2/Routes/Settings/IX/IXDashboard.tsx"
    "app/react/V2/Routes/Settings/IX/IXSuggestions.tsx"
    "app/react/V2/Routes/Settings/IX/components/PDFSidepanel.tsx"
    "app/react/V2/Routes/Settings/IX/components/PropertySidepanel.tsx"
    "app/react/V2/Routes/Settings/IX/components/SidepanelForms.tsx"
    "app/react/V2/Routes/Settings/IX/helpers/sidepanelFunctions.ts"
    "app/react/V2/Routes/Settings/ParagraphExtraction/PXEntities.tsx"
    "app/react/V2/Routes/Settings/ParagraphExtraction/components/entities/DeleteDialog/index.tsx"
    "app/react/V2/Routes/Settings/ParagraphExtraction/components/entities/ExtractEntitiesDialog/index.tsx"
    "app/react/V2/Routes/Settings/ParagraphExtraction/components/extractors/CreateDialog/steps/ExtractionConfiguration/Footer.tsx"
    "app/react/V2/Routes/Settings/RelationshipTypes/RelationshipTypes.tsx"
    "app/react/V2/Routes/Settings/Templates/Templates.tsx"
    "app/react/V2/Routes/Settings/Templates/components/AddRelationshipTypeModal.tsx"
    "app/react/V2/Routes/Settings/Templates/components/AddThesaurusModal.tsx"
    "app/react/V2/Routes/Settings/Thesauri/ThesauriList.tsx"
)

# For each file, resolve conflicts by keeping HEAD (ESM) version
for file in "${conflict_files[@]}"; do
    if [ -f "$file" ]; then
        echo "Resolving conflicts in $file..."

        # Use git checkout to take our version (HEAD) for conflicted files
        git checkout --ours "$file"
        git add "$file"
    else
        echo "File $file not found, skipping..."
    fi
done

echo "Conflict resolution complete!"
