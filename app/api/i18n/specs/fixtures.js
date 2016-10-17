export default {
  docs: [
    {
      _id: '2',
      type: 'translation',
      locale: 'en',
      values: {
        'System': {
          'Password': 'Password',
          'Account': 'Account',
          'Email': 'E-Mail',
          'Age': 'Age'
        }
      }
    },
    {
      _id: '3',
      type: 'translation',
      locale: 'es',
      values: {
        'System': {
          'Password': 'Contraseña',
          'Account': 'Cuenta',
          'Email': 'Correo electronico',
          'Age': 'Edad'
        }
      }
    },
    {
      _id: '4',
      type: 'settings',
      "languages": [
       {
           "key": "es",
           "label": "Español"
       },
       {
           "key": "en",
           "label": "English",
           "default": true
       }
   ]
    }
  ]
};
