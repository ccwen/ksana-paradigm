/*
   PCODE : internal encoding for SPAN, REL with optional DB

   SPAN  : a text range created by user mouse selection [vpos,len]   , where len <256

   REL  : an payload with pcodes, might have no pcode after deletion

   DB   : 1~255 , database id.

   Forward Barrel: pcode as key, value is an array
   backward Barrel: inverted index for pcode, an array of all other pcode containing it.
   dbid : external db id, each paradigm might have different dbid for same dbname
*/
var error="";
var container={};

var addSpan=function(start,len,payload){
	var pcode=pcodeFromSpan.call(this,start,len);
	var F=this.forward[pcode[0]];
	if (!F) {
		this.forward[pcode[0]]=F=[];
	}
	var n=F.length;
	F.push(payload);
	return n;
}
var setSpanCaption=function(start,len,caption) {
	var pcode=pcodeFromSpan.call(this,start,len);
	var F=this.forward[pcode[0]];
	if (!F) {
		this.addSpan(start,len,{caption:caption});
	} else {
		F[0].caption=caption;
	}
}
var getDBName=function(dbid) {
	return this.dbid[dbid];
}

var getExternal=function(dbid_name) {
	var dbname=dbid_name;
	if (typeof dbid_name==="number") {
		dbname=this.getDBName(dbid_name);
	}
	return container[dbname];
}
//var getExternalDbIdByName=function(name) {
//	return this.dbid.indexOf(name);
//}
var getPayload=function(pcode,n) {
	//pcode can be a span,  [span, dbid] or [span , "dbname"]
	if (pcode[1]) {
		var externaldb=this.getExternal(pcode[1]);
		if (!externaldb) return null;
		return externaldb.getPayload(pcode[0],n);
	} else if (typeof pcode[0]=="number") {
		pcode=pcode[0];
	}

	var F=this.forward[pcode];
	if (F) {
		if (isRel(pcode)) return F[0];
		else if (typeof n=="number") return F[n]
		else return F;
	}
}
var getChildren=function(pcode) {
	var F=this.forward[pcode];
	if (F && isRel(pcode)) {
		return F.filter(function(i,n){return (n>0)});
	}
}
var _removeSpan=function(F,n) {
	if (typeof n=="object") {
		for (var i=0;i<F.length;i++) {
			if (F[i]==n) break;
		}
		if (i<F.length) F.splice(i,1);
	} else {

		if (F[n]) F.splice(n,1);
	}
}
var isRel=function(pcode) {
	return (pcode%256===0 && pcode>255)
}

var _removeBackward=function(pcode,source) {
	var p=this.backward[pcode];
	var i=p.indexOf(source);
	if (i==-1) {
		error=source+" not in "+pcode;
		return;
	}
	p.splice(i,1);
}
var _removeChild=function(rel,childpcode) {
	var pcodes=this.forward[rel];

	var i=pcodes.indexOf(childpcode);
	if (i>0) {
		pcodes.splice(i,i);
	}
}
var _removeRel=function(pcode) {
	var pcodes=this.forward[pcode];
	for (var i=1;i<pcodes.length;i++) {
		_removeBackward.call(this,pcodes[i],pcode);
	}
	var rels=this.backward[pcode];
	if (rels && rels.length) {
    rels.map(function(rel){ _removeChild.call(this,rel,pcode)},this);
	}

	delete this.forward[pcode];
}
var remove=function(pcode,n) {
	if (typeof pcode!=="number") {
		pcode=pcode[0];
	}
	var F=this.forward[pcode];
	if (!F)return;
	if (isRel(pcode)){
		_removeRel.call(this,pcode);
	} else {
		_removeSpan.call(this,F,n);
	}
}
var _createRelPcode=function() {
	return (++this.relationCount)*256;
}
var _addBackward=function(target,source) {

	if (!this.backward[target]) this.backward[target]=[];
	this.backward[target].push(source);
}
var addRel=function() {
	var args = Array.prototype.slice.call(arguments);
	var payload = args.shift();

	var pcode=_createRelPcode.call(this);

	if (this.forward[pcode]) {
		error="repeated relation pcode";
		return -1;
	}

	this.forward[pcode]=[JSON.parse(JSON.stringify(payload))];
	for (var i=0;i<args.length;i++) {
		var child=args[i];
		if (typeof child!="number" && typeof child!=="string" && child[1]===0) {
			child=child[0]; //same db, only store span
		}
		this.forward[pcode].push(child);

		if (typeof child==="number") _addBackward.call(this,child,pcode);
	}
	return pcode;
}
var by=function(pcode) {
	//pcode can be a span,  [span, dbid] or [span , "dbname"]
	if (pcode[1]) {
		var externaldb=this.getExternal(pcode[1]);
		if (!externaldb) return null;
		return externaldb.by([pcode[0],0]);
	} else if (typeof pcode[0]=="number") {
		pcode=pcode[0];
	}
	return this.backward[pcode||[]];
}

var Paradigm=function(opts) {
	this.forward={};
	this.backward={};
	this.dbid=[];
	this.relationCount=0;
	this.opts=opts;
}
var externalPCode=function(pcode,db) {
	if (typeof pcode!=="number") return;

	var dbid=this.dbid.indexOf(db);
	if (dbid==-1) {
		this.dbid.push(db);
		dbid=this.dbid.length-1;
	}
	return [pcode,dbid];
}
var pcodeFromSpan=function(start,len,db){
	if (typeof len=="undefined" && typeof start!="undefined" && typeof start[1]!="undefined") {
		db=len;
		len=start[1];
		start=start[0];
	}
	if (len>255) {
		error="len too big";
		return -1;
	}
	if (len<1) {
		error="len too big";
		return -2;
	}
	if (start<1) {
		error="wrong start";
		return -3;
	}
	var code=start*256+len, dbid=0;
	if (db) {
		dbid=this.dbid.indexOf(db);
		if (dbid==-1) {
			this.dbid.push(db);
			dbid=this.dbid.length-1;
		}
	}
	return [code,dbid];
}
var lasterror=function() {
	return error;
}
var spanFromPcode=function(pcode) {
	var out= [pcode[0]>>8,pcode[0] %256];
	if (pcode[1]) out.push(pcode[1]);
	return out;
}
var open=function(dbname,opts) {
	if (!container[dbname]) {
		container[dbname]=new Paradigm(opts);
		container[dbname].dbid.push(dbname);
	}
	return container[dbname];
}

/*
var buildBackward=function() {
  for (var pcode in this.forward) {
    var rels=this.forward[i];
    if (!isRel(pcode)) continue;
    for (var j=0;j<rels.length;j++) {
      var child=rels[j];
      if (typeof child==="number"){
        _addBackward.call( this, child, pcode );
      } else if (child[1]){ //foreign
        // todo , build backward
        //add backward if loaded
      }
    }
  }
}
*/
var loadFromString=function(dbname,data) {
  var db=open(dbname);
	if (!data) return db;
	var serialized=JSON.parse(data);
  db.forward=serialized.forward;
  db.backward=serialized.backward;
  db.relationCount=serialized.relationCount;
  db.dbid=serialized.dbid;
  return db;
  //buildBackward.call(this);
}
var saveToString=function() {
  var serialized={forward:this.forward,backward:this.backward,
    dbid:this.dbid,opts:this.opts,relationCount:this.relationCount};
  return JSON.stringify(serialized);
}

var get=function(pcode) {

	if (pcode[1]) {
		var externaldb=this.getExternal(pcode[1]);
		if (!externaldb) return null;
		return externaldb.get(pcode[0]);
	} else if (typeof pcode[0]=="number") {
		pcode=pcode[0];
	}
	return this.forward[pcode];
}
Paradigm.prototype.get=get;
Paradigm.prototype.addSpan=addSpan;
Paradigm.prototype.addRel=addRel;
Paradigm.prototype.setSpanCaption=setSpanCaption;
//Paradigm.prototype.createBySelections=createBySelections;
Paradigm.prototype.getPayload=getPayload;
Paradigm.prototype.getChildren=getChildren;
Paradigm.prototype.by=by;
Paradigm.prototype.remove=remove;
Paradigm.prototype.pcodeFromSpan=pcodeFromSpan;
Paradigm.prototype.spanFromPcode=spanFromPcode;
Paradigm.prototype.getDBName=getDBName;
Paradigm.prototype.getExternal=getExternal;
//Paradigm.prototype.getExternalDbIdByName=getExternalDbIdByName;
Paradigm.prototype.externalPCode=externalPCode;
Paradigm.prototype.saveToString=saveToString;

var API={open:open,lasterror:lasterror,isRel:isRel,loadFromString:loadFromString};
module.exports=API;
