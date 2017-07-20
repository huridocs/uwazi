webpack
babel -D app/ -d ./build/app --ignore app/api/swagger/
cp -fR app/api/swagger/ build/app/api/swagger
mv dist ./build
cp server.js build/server.js
cp -fR public build
