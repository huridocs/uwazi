export default {
  filterRelevant: (references, locale) => {
    return references.filter(ref => {
      const isOutboundMetadata = !ref.inbound && ref.sourceType === 'metadata';
      const isOtherLocale = ref.language && ref.language !== locale;
      return !(isOtherLocale || isOutboundMetadata);
    });
  }
};
