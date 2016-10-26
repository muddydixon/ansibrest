module.exports = (listTasks)=>{
  const lines = listTasks.split("\n").filter((l)=> !l.match(/^[\s]*$/)).map((l)=>{
    const m = l.match(/^(\s*)([^\t]+)(\tTAGS:\s+\[(.*)\])?$/);
    if(!m) return null;
    const indentLevel = m[1].length;
    const tags = m[4] ? m[4].split(/\s*,\s*/) : [] ;
    const name = m[2];
    return {name, indentLevel, tags};
  }).filter((l)=>l);

  const playbook = {
    name: null,
    plays: []
  };

  lines.forEach((l)=>{
    if(l.indentLevel === 0){
      playbook.name = l.name.replace(/^playbook:\s+/, "");
    }else if(l.indentLevel === 2){
      const m = l.name.match(/^play\s#\d\s\((.+)\):$/);
      playbook.plays.push({
        name: m[1],
        tags: l.tags,
        tasks: []
      });
    }else if(l.indentLevel === 4){
      playbook.plays[playbook.plays.length - 1].tasks.push({
        name: l.name,
        tags: l.tags
      });
    }
  });
  return playbook;
};
