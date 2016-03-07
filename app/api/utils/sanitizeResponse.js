let sanitizeResponse = (response) => {

  response.rows = response.rows.map((row) => {
    return row.value;
  });

  return response;
};

export default sanitizeResponse;
