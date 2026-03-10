# RandGym

Application made with Codex AI to help me with my personal exercises. 
Basically it has a JSON with some exercises and when you press a button, it will randomize your routine. After that, you have predefined series with weights, but you can edit them if you want. The changes are saved on LocalStorage so they´ll be lost if you delete the navigator´s data. Also, the application saves the last time you did an exercise and said exercise will only be available again after a week, to avoid having the same routine twice in a week

## Requirements
- Node.js 18+ (recomendado)
- npm

## Instalation
```bash
npm install
```

## Execute on local
```bash
npm run start
```
Then open `http://localhost:4200`.

## Execute with VS Code (Run and Debug)
It includes configuration to debug on Angular:
- Open the pannel Run and Debug
- Select "Angular: Serve + Chrome"
- Start debugging

If VS Code asks for `launchSettings.json`, that´s because it is attemptin to use a .NET profile. Select Angular and make sure to not be using .NET
