var assert=require("assert");
var API=require("..");
var pd=null,pcode;
describe("",function(){
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

	it("add and get simple tag",function(){
		var payload={"tag":"important"};
		var pcode=API.pcodeFromSpan(5,2);

		var n=pd.addSpan(5,2,payload);
		var py=pd.get(pcode,n);
		assert.deepEqual(py,payload);

		pd.remove(pcode,py);
		py=pd.get(pcode,n);
		assert.equal(!!py,false);


		n=pd.addSpan(5,2,payload);
		pd.remove(pcode,n);
		py=pd.get(pcode,n);
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

		var py=pd.get(pcode);
		assert.deepEqual(py,payload);
	});


	it("remove relation",function(){
		pd.remove(pcode);

		var pcode1=API.pcodeFromSpan(5,2);
		var p=pd.by(pcode1);
		assert.equal(p.length,0);

	});
});