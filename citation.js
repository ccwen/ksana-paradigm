/*
	extract citations from text and convert to vpos
	input: 
	   text,
	   startvpos
	   pat  : pattern of citation , must have two parenthesis
	   tokenize: tokenizer, return charOffset if omitted

	output format:
	[source_start_vpos,source_len,source, citation_start_vpos,citation_len, citation]
*/
var extract=function(text,opts) {
	var out=[];
	if (!text)return;
	text.replace(opts.pat,function(m,m1,m2,idx){
		var i=m.indexOf(m1);
		var m1start=i+idx;
		var m1end=m1start+m1.length;
		var i=m.indexOf(m2);
		var m2start=i+idx;

		var m2end=m2start+m2.length;
		out.push([m1start,m1end,m1,m2start,m2end,m2]);
	});
	opts.startvpos=opts.startvpos||0;
	var noffset=0;

	if (opts.tokenize) {
		var tokenized=opts.tokenize(text);
		var offsets=tokenized.offsets;
		//convert to vpos
		for (var i=0;i<out.length;i++) {
			for (var j=0;j<out[i].length;j++) {
				if (typeof out[i][j]!="number") continue;
				while (offsets[noffset]<out[i][j] && noffset<offsets.length)  noffset++;
				out[i][j]=opts.startvpos+noffset;
			}
		}
	}


	//convert to length
	out.forEach(function(m){
		m[1]=m[1]-m[0];
		m[4]=m[4]-m[3];

	})

	return out;
}
module.exports={extract:extract};