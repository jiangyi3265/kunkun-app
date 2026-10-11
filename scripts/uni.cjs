const {spawnSync}=require('node:child_process');const path=require('node:path');
const root=path.resolve(__dirname,'..');
// postinstall can be skipped; verify the reviewed dependency bytes before loading
// any compiler code. Builds never silently repair or accept unknown dependencies.
const guard=spawnSync(process.execPath,[path.join(root,'scripts/apply-braces-hardening.cjs'),'--check',root],{cwd:root,stdio:'inherit'});
if(guard.error||guard.status!==0){console.error('构建已停止：依赖安全补丁校验失败，请检查安装及补丁记录。');process.exit(guard.status||1)}
const cli=path.join(path.dirname(require.resolve('@dcloudio/vite-plugin-uni/package.json')),'bin','uni.js');
const r=spawnSync(process.execPath,[cli,...process.argv.slice(2)],{cwd:root,stdio:'inherit',env:{...process.env,UNI_INPUT_DIR:root}});process.exit(r.status??1);
