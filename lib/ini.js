module.exports = {
  parse: (text)=>{
    const lines = text.split("\n").filter((l)=> l && !l.match(/^[;#]/));
    const data = {};
    var section = "global";
    lines.forEach((l)=>{
      if(l.match(/^\[([^\]]+)\]/)){
        const m = l.match(/^\[([^\]]+)\]/);
        section = m[1];
        data[section] = {};
      }else{
        const kv = l.split(/\s*=\s*/);
        data[section][kv[0]] = kv[1] || kv[0];
      }
    });
    return data;
  }
}
