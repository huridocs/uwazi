/* eslint-disable max-statements */
import { isString } from 'lodash';
import uniqueID from 'shared/uniqueID';

const prepareFiles = async (mediaProperties, values) => {
  const metadataFiles = {};
  const entityAttachments = [];
  const files = [];

  if (values.metadata) {
    await Promise.all(
      mediaProperties.map(async p => {
        if (!values.metadata[p.name]) {
          return Promise.resolve();
        }
        
        // 🔧 FIX: Handle different data structures
        const metadataValue = values.metadata[p.name];
        
        // Skip if it's a simple URL string (from URL input)
        if (typeof metadataValue === 'string' && /^https?:\/\//.test(metadataValue)) {
          console.log('🔧 [FIX] Skipping URL string (preserving original URL):', {
            propertyName: p.name,
            url: metadataValue
          });
          return Promise.resolve();
        }
        
        // Skip if it's not an object with data/originalFile
        if (typeof metadataValue !== 'object' || !metadataValue.data) {
          return Promise.resolve();
        }
        
        const { data, originalFile } = metadataValue;
        if (originalFile) {
          // 🔧 FIX: Prioritize originalFile over blob URL data
          if (originalFile instanceof File) {
            // File object from MediaModal fix (preferred)
            console.log('🔧 [FIX] Processing File object from originalFile:', {
              propertyName: p.name,
              fileName: originalFile.name,
              fileSize: originalFile.size,
              fileType: originalFile.type,
              hasBlobUrl: data && data.startsWith('blob:')
            });
            
            const fileID = uniqueID();
            metadataFiles[p.name] = fileID;
            
            entityAttachments.push({
              originalname: originalFile.name,
              filename: originalFile.name,
              type: 'attachment',
              mimetype: originalFile.type,
              fileLocalID: fileID,
            });
            
            files.push(originalFile);
            return Promise.resolve();
          }
          
          // Fallback: Handle direct File object in data field
          if (data instanceof File) {
            console.log('🔧 [FIX] Processing direct File object from data field:', {
              propertyName: p.name,
              fileName: data.name,
              fileSize: data.size,
              fileType: data.type
            });
            
            const fileID = uniqueID();
            metadataFiles[p.name] = fileID;
            
            entityAttachments.push({
              originalname: data.name,
              filename: data.name,
              type: 'attachment',
              mimetype: data.type,
              fileLocalID: fileID,
            });
            
            files.push(data);
            return Promise.resolve();
          }
          
          // Handle blob URLs (legacy case)
          const validBlobUrlRegExp =
            /^\(?(blob:https?:\/\/(?:www\.)?[-a-zA-Z0-9+&@#/%?=~_|!:,.;]*[-a-zA-Z0-9+&@#/%=~_|])(, ({.+}))?/;

          const [, url, , timeLinks] = data.match(validBlobUrlRegExp) || ['', data];
          
          console.log('🔄 [SIMULATION] prepareFiles processing blob URL:', {
            propertyName: p.name,
            blobUrl: url,
            originalData: data,
            hasApostrophe: p.name.includes("'"),
            propertyNameLength: p.name.length,
            propertyNameEncoded: encodeURIComponent(p.name)
          });
          
          // 🔍 DEBUG: Special handling for properties with apostrophes
          if (p.name.includes("'")) {
            console.log('🔍 [DEBUG] Property with apostrophe detected:', p.name);
            console.log('🔍 [DEBUG] This might be causing processing issues');
            console.error('🔍 [DEBUG] APOSTROPHE PROPERTY DETECTED:', p.name);
            console.warn('🔍 [DEBUG] APOSTROPHE PROPERTY DETECTED:', p.name);
          }
          
          // 🔧 FIX: Remove simulation failures - process all blob URLs
          // const shouldFail = Math.random() < 0.3; // 30% chance of failure
          // if (shouldFail) {
          //   console.log('🚨 [SIMULATION] Simulating blob URL processing failure for property:', p.name);
          //   console.log('🚨 [SIMULATION] This will cause the blob URL to remain in metadata');
          //   // Don't process the blob URL - let it remain in metadata
          //   return Promise.resolve();
          // }
          
          // 🔧 FIX: Remove network delay simulation
          // const networkDelay = Math.random() < 0.2 ? Math.random() * 3000 : 0; // 20% chance of delay up to 3 seconds
          // if (networkDelay > 0) {
          //   console.log('🚨 [SIMULATION] Simulating network delay:', networkDelay + 'ms');
          //   await new Promise(resolve => setTimeout(resolve, networkDelay));
          // }
          
          try {
            const blob = await fetch(url).then(r => r.blob());
            const file = new File([blob], originalFile.name, { type: blob.type });
            const fileID = uniqueID();

            console.log('✅ [SIMULATION] Blob URL successfully converted to file:', {
              propertyName: p.name,
              fileID,
              fileName: file.name
            });

            metadataFiles[p.name] = fileID;

            entityAttachments.push({
              originalname: file.name,
              filename: file.name,
              type: 'attachment',
              mimetype: blob.type,
              fileLocalID: fileID,
              timeLinks,
            });

            files.push(file);
          } catch (error) {
            console.log('❌ [SIMULATION] Blob URL processing failed:', {
              propertyName: p.name,
              error: error.message,
              blobUrl: url
            });
            // Let the blob URL remain in metadata (this causes the issue)
          }
        }
      })
    );
  }

  return { metadataFiles, entityAttachments, files };
};

function wrapEntityMetadata(entity, template) {
  const mediaProperties =
    template.properties?.filter(prop => prop.type === 'image' || prop.type === 'media') || [];

  if (!entity.metadata) {
    return { ...entity };
  }
  const newFileMetadataValues = (entity.attachments || [])
    .filter(attachment => attachment.fileLocalID)
    .reduce(
      (previousValue, attachment, index) => ({
        ...previousValue,
        [attachment.fileLocalID]: { value: '', attachment: index, timeLinks: attachment.timeLinks },
      }),
      {}
    );

  const metadata = Object.keys(entity.metadata).reduce((wrappedMo, key) => {
    let timeLinks;
    const property = mediaProperties.find(p => p.name === key);
    const fieldValue = entity.metadata[key]?.data || entity.metadata[key];
    let fileLocalID = fieldValue;
    
    // 🔍 DEBUG: Log property processing
    console.log('🔍 [DEBUG] wrapEntityMetadata processing property:', {
      key,
      hasApostrophe: key.includes("'"),
      propertyFound: !!property,
      propertyType: property?.type,
      fieldValue,
      fieldValueType: typeof fieldValue,
      isBlobUrl: typeof fieldValue === 'string' && fieldValue.startsWith('blob:')
    });
    
    // 🔍 DEBUG: Make apostrophe properties more visible
    if (key.includes("'")) {
      console.error('🔍 [DEBUG] APOSTROPHE PROPERTY IN wrapEntityMetadata:', {
        key,
        propertyFound: !!property,
        propertyType: property?.type,
        isBlobUrl: typeof fieldValue === 'string' && fieldValue.startsWith('blob:')
      });
      console.warn('🔍 [DEBUG] APOSTROPHE PROPERTY IN wrapEntityMetadata:', key);
    }
    if (property && entity.metadata[key] && property.type === 'media') {
      const uniqueIdTimeLinksExp = /^\(?([\w+]{5,15})(, ({.+})\))?|$/;
      const mediaExpGroups = fieldValue.match(uniqueIdTimeLinksExp);
      if (isString(fieldValue) && mediaExpGroups && mediaExpGroups[1]) {
        [, fileLocalID = fieldValue, , timeLinks] = mediaExpGroups || [];
      }
      if (fileLocalID && fileLocalID.length < 20 && timeLinks) {
        newFileMetadataValues[fileLocalID] = { ...newFileMetadataValues[fileLocalID], timeLinks };
      }
    }

    const metadataValue = newFileMetadataValues[fileLocalID];
    return {
      ...wrappedMo,
      [key]: Array.isArray(entity.metadata[key])
        ? entity.metadata[key].map(v => ({ value: v }))
        : [metadataValue || { value: entity.metadata[key]?.data || entity.metadata[key] }],
    };
  }, {});

  return { ...entity, metadata };
}

const prepareMetadataAndFiles = async (values, attachedFiles, template, mediaProperties) => {
      // 🔧 FIX: Remove blob URL expiration simulation
      // const shouldExpireBlobUrls = Math.random() < 0.25; // 25% chance
      // if (shouldExpireBlobUrls && values.metadata) {
      //   console.log('🚨 [SIMULATION] Forcing blob URL expiration before processing');
      //   Object.entries(values.metadata).forEach(([key, value]) => {
      //     if (value && typeof value === 'object' && value.data && value.data.startsWith('blob:')) {
      //       console.log('🚨 [SIMULATION] Revoking blob URL:', value.data);
      //       URL.revokeObjectURL(value.data);
      //       // The blob URL is now invalid, which will cause processing to fail
      //     }
      //   });
      // }
  
  const { metadataFiles, entityAttachments, files } = await prepareFiles(mediaProperties, values);
  const fields = { ...values.metadata, ...metadataFiles };
  const entity = { ...values, metadata: fields, attachments: entityAttachments };
  const wrappedEntity = wrapEntityMetadata(entity, template);
  wrappedEntity.file = values.file ? values.file[0] : undefined;
  wrappedEntity.attachments = [];
  wrappedEntity.attachments.push(...files);
  wrappedEntity.attachments.push(...attachedFiles);
  
  // 🔧 FIX: Fallback - remove any remaining blob URLs from metadata (but preserve URLs)
  Object.keys(wrappedEntity.metadata).forEach(key => {
    const value = wrappedEntity.metadata[key];
    if (value && value[0] && value[0].value) {
      const fieldValue = value[0].value;
      
      // Only remove blob URLs, preserve HTTP/HTTPS URLs
      if (fieldValue.startsWith('blob:') && !fieldValue.startsWith('https://') && !fieldValue.startsWith('http://')) {
        console.log('🔧 [FALLBACK FIX] Removing remaining blob URL from metadata:', {
          property: key,
          blobUrl: fieldValue
        });
        value[0].value = ''; // Set to empty string instead of blob URL
      } else if (fieldValue.startsWith('https://') || fieldValue.startsWith('http://')) {
        console.log('🔧 [FALLBACK FIX] Preserving URL in metadata:', {
          property: key,
          url: fieldValue
        });
      }
    }
  });
  
  // 📊 Log final entity to see if blob URLs remain
  console.log('📊 [FIX] Final entity metadata after fallback cleanup:', JSON.stringify(wrappedEntity.metadata, null, 2));
  
  return { ...wrappedEntity, template: template._id };
};

export { prepareMetadataAndFiles, wrapEntityMetadata };
