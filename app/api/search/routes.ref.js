/**
* @swagger
* /search:
*   get:
*     tags:
*       - search
*     description: Returns a list of entities matching the filters
*     parameters:
*       - name: searchTerm
*         description: A string to search for inside documents and titles
*         in:  query
*         required: false
*         type: string
*       - name: types
*         description: An url encoded array of type _ids
*         in:  query
*         required: false
*         type: string
*         example: '["_id1", "_id2"]'
*       - name: order
*         in:  query
*         required: false
*         type: string
*         enum: ['asc', 'desc']
*       - name: sort
*         description: A property to sort results by
*         in:  query
*         required: false
*         type: string
*         example: creationDate
*       - name: filters
*         description: An url encoded object with properties to filter by and the values of the filter
*         in:  query
*         required: false
*         type: string
*         example: '{"multi_select_property_name":["value_selected", "value_selected"]}'
*     responses:
*       200:
*         description: Returns an object with the result
*         schema:
*           type: object
*           properties:
*             rows:
*               type: array
*               items:
*                 $ref: '#/definitions/Entity'
*             aggregations:
*               type: object
*               description: An object that contains the amount of matches for the different possible filters for the actual selected filters.
*             totalRows:
*               type: integer
*/
