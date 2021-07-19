module.exports = {
  presets: [
    '@vue/cli-plugin-babel/preset'
  ],
  env: {
    production: {
      plugins: [["inline-dotenv",{
        path: '.env.production'
      }]]
    },
    development: {
      plugins: [["inline-dotenv",{
        path: '.env.development'
      }]]
    }
  }
}
