export default {
  docs: [
    {
      _id: '2',
      type: 'translation',
      locale: 'en',
      contexts: [
        {
          id: '123',
          label: 'System',
          'values': {
            'Password': 'Password',
            'Account': 'Account',
            'Email': 'E-Mail',
            'Age': 'Age'
          }
        }
      ]
    },
    {
      _id: '3',
      type: 'translation',
      locale: 'es',
      contexts: [
        {
          id: '123',
          label: 'System',
          'values': {
            'Password': 'Contraseña',
            'Account': 'Cuenta',
            'Email': 'Correo electronico',
            'Age': 'Edad'
          }
        }
      ]
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
