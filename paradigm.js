/*
   PCODE : internal encoding for SPAN, REL or DB
   SPAN  : a text range created by user mouse selection [vpos,len]   , where len <256
           and a payload
   payload of SPAN sharing same Pcode are stored together in an array
   
   REL  : an payload with pcodes, might have no pcode after deletion

   DB   : 1~255 , database id.

   Forward Barrel: pcode as key, value is an array
   backward Barrel: inverted index for pcode, an array of all other pcode containing it.
*/
var error="";
var container={};
var createBarrel=function() {
	var barrel={};
	return barrel;
}

var addSpan=function(start,len,payload){
	var pcode=pcodeFromSpan(start,len);
	var F=this.forward[pcode];
	if (!F) {
		this.forward[pcode]=F=[];
	}
	var n=F.length;
	F.push(payload);
	return n;
}
var getPayload=function(pcode,n) {
	var F=this.forward[pcode];
	if (F) {
		if (isRel(pcode)) return F[0];
		else return F[n];
	}
}
var getChildren=function(pcode) {
	var F=this.forward[pcode];
	if (F && isRel(pcode)) {
		return F.filter(function(i,n){return n>0});
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
	return (pcode%256===0)
}
var _removeForward=function() {

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
	var by=this.backward[pcode];
	if (by && by.length) {
		by.map(function(rel){ _removeChild.call(this,rel,pcode)},this);
	}

	delete this.forward[pcode];
}
var remove=function(pcode,n) {
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
		this.forward[pcode].push(args[i]);
		_addBackward.call(this,args[i],pcode);
	}
	return pcode;
}
var by=function(pcode) {
	return this.backward[pcode]||[];
}
var open=function(dbname,opts) {
	if (!container[dbname]) {
		container[dbname]={
			forward:createBarrel()
			,backward:createBarrel()
			,opts:opts
			,relationCount:0
			,addSpan:addSpan
			,addRel:addRel
			,getPayload:getPayload
			,getChildren:getChildren
			,by:by
			,remove:remove
		}
	}
	return container[dbname];
}

var pcodeFromSpan=function(start,len){
	if (typeof len=="undefined" && typeof start!="undefined" && typeof start[1]!="undefined") {
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
	return start*256+len;
}
var lasterror=function() {
	return error;
}
var spanFromPcode=function(pcode) {
	return [pcode>>8,pcode %256];
}



var API={open:open,pcodeFromSpan:pcodeFromSpan,spanFromPcode:spanFromPcode,lasterror:lasterror,isRel:isRel};
module.exports=API;