module.exports = {
    apps: [
      {
        name: 'App', // Name of the application
        script: 'src/app.js', // Path to your entry script
        instances: 'max', // Number of instances to run (you can also set a specific number)
        exec_mode: 'cluster', // Run in cluster mode
        env: {
            NODE_ENV: 'development', // Environment variable for development
            TELEGRAM_BOT_TOKEN: '7813201051:AAEJde1-67FyAbfWk4K_g4dps6rzATXALWM',
            MONGO_URI: 'mongodb+srv://rohitparakh4:Rohit%40612.@cluster0.mb8ck.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
            PORT: 3000

        },
        env_production: {
            NODE_ENV: 'production', // Environment variable for production
            TELEGRAM_BOT_TOKEN: '7813201051:AAEJde1-67FyAbfWk4K_g4dps6rzATXALWM',
            MONGO_URI: 'mongodb+srv://rohitparakh4:Rohit%40612.@cluster0.mb8ck.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
            PORT: 3000
        },
      },
    ],
  };
  