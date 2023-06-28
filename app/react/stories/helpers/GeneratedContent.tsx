import React from 'react';

const GeneratedContent = ({ rows }: { rows?: number }) => {
  const maxRows = rows || 8;
  const contents: React.ReactNode[] = [];

  for (let index = 1; index < maxRows; index += 1) {
    contents.push(
      <>
        <h1 className="font-bold">Item {index}</h1>
        <p className="mb-1">
          Fusce id mi eu mauris bibendum dignissim nec in sem. Sed ultrices varius mauris quis
          placerat. Donec imperdiet sodales diam sed imperdiet. Aenean a nisl venenatis lectus
          mattis pellentesque. Duis fermentum ante a ultricies feugiat. Proin dapibus luctus purus
          id viverra. Aenean a aliquet nibh. Aenean facilisis justo quis sem auctor, nec mollis
          tortor placerat. Cras eget enim mollis, mollis risus gravida, pharetra risus. Mauris
          dapibus malesuada mi, quis ornare felis imperdiet eget. Donec sed quam non dolor sodales
          hendrerit. Aenean suscipit, velit sed laoreet cursus, ante odio tristique lectus, a porta
          eros felis eu sem. Curabitur eu gravida dolor. Ut iaculis lacus vitae libero viverra
          interdum. Phasellus ac est consectetur, malesuada nisl nec, blandit lorem.
        </p>
        <hr className="mb-2" />
      </>
    );
  }

  return <>{contents.map(content => content)}</>;
};

export { GeneratedContent };
