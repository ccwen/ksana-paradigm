var assert=require("assert");
var API=require("..").barrel;
var pd=null,pcode;
describe("Barrel",function(){
	it("open paradigm",function(){
		pd=API.open("db1");
		assert.equal(!!pd,true);
	});

	it("pcode of span",function(){
		var inputspan=[5,2];
		var pcode=API.pcodeFromSpan(inputspan);
		var span=API.spanFromPcode(pcode);
		assert.deepEqual(span,inputspan);

		pcode=API.pcodeFromSpan([5,256]); //too big
		assert.equal(pcode,-1);

		pcode=API.pcodeFromSpan([5,0]); //too big
		assert.equal(pcode,-2);
	});

	it("add and getPayload simple tag",function(){
		var payload={"tag":"important"};
		var pcode=API.pcodeFromSpan(5,2);

		var n=pd.addSpan(5,2,payload);
		var py=pd.getPayload(pcode,n);
		assert.deepEqual(py,payload);

		pd.remove(pcode,py);
		py=pd.getPayload(pcode,n);
		assert.equal(!!py,false);


		n=pd.addSpan(5,2,payload);
		pd.remove(pcode,n);
		py=pd.getPayload(pcode,n);
		assert.equal(!!py,false);
	});

	it("add relation",function(){
		var pcode1=API.pcodeFromSpan(5,2);
		var pcode2=API.pcodeFromSpan(10,3);
		var payload={"tag":"synonym"};
		pcode=pd.addRel(payload,pcode1,pcode2);

		assert.equal(pcode>0,true);

		var p=pd.by(pcode1);
		assert.equal(p.length,1);
		assert.equal(p[0],pcode);

		var p=pd.by(pcode2);
		assert.equal(p.length,1);
		assert.equal(p[0],pcode);

		var py=pd.getPayload(pcode);
		assert.deepEqual(py,payload);
	});


	it("remove relation",function(){
		pd.remove(pcode);

		var pcode1=API.pcodeFromSpan(5,2);
		var p=pd.by(pcode1);
		assert.equal(p.length,0);

	});

	it("remove intermediate relation",function() {
		var pcode1=API.pcodeFromSpan(1,2);
		var pcode2=API.pcodeFromSpan(2,2);
		var pcode3=API.pcodeFromSpan(3,2);
		var pcode4=API.pcodeFromSpan(4,2);

		var rel1=pd.addRel({tag:'t1'},pcode1,pcode2);	
		var rel2=pd.addRel({tag:'t2'},pcode3,pcode4);
		var rel3=pd.addRel({tag:'complex relation'},rel1,rel2);

		var children=pd.getChildren(rel3);
		assert.equal(children.length,2);

		pd.remove(rel1);

		var children=pd.getChildren(rel3);
		assert.equal(children.length,1);
	});
});