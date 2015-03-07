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
		var pcode=pd.pcodeFromSpan(inputspan);
		var span=pd.spanFromPcode(pcode);

		assert.deepEqual(span,inputspan);

		pcode=pd.pcodeFromSpan([5,256]); //too big
		assert.equal(pcode,-1);

		pcode=pd.pcodeFromSpan([5,0]); //too big
		assert.equal(pcode,-2);

	});

	it("add and getPayload simple tag",function(){
		var payload={"tag":"important"};

		var pcode=pd.pcodeFromSpan(5,2);

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
		var pcode1=pd.pcodeFromSpan(5,2);
		var pcode2=pd.pcodeFromSpan(10,3);
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

		var pcode1=pd.pcodeFromSpan(5,2);
		var p=pd.by(pcode1);

		assert.equal(p.length,0);

	});

	it("remove intermediate relation",function() {
		var pcode1=pd.pcodeFromSpan(1,2);
		var pcode2=pd.pcodeFromSpan(2,2);
		var pcode3=pd.pcodeFromSpan(3,2);
		var pcode4=pd.pcodeFromSpan(4,2);

		var rel1=pd.addRel({tag:'t1'},pcode1,pcode2);
		var rel2=pd.addRel({tag:'t2'},pcode3,pcode4);
		var rel3=pd.addRel({tag:'complex relation'},rel1,rel2);

		var children=pd.getChildren(rel3);
		assert.equal(children.length,2);

		pd.remove(rel1);

		var children=pd.getChildren(rel3);
		assert.equal(children.length,1);
	});

	it("allow string in relation",function(){
		var pcode1=pd.pcodeFromSpan(1,2);
		var pcode2=pd.pcodeFromSpan(2,2);
		var rel1=pd.addRel({tag:'t1'},pcode1,"abc",pcode2);
		var children=pd.getChildren(rel1);
		assert.equal(children.length,3);
	});

	it("db prefix",function(){
		var pcode1=pd.pcodeFromSpan(1,2,"db2");
		var pcode2=pd.pcodeFromSpan(1,2,"db3");

		assert.equal(pcode1[1]>0,true);
		assert.equal(pcode2[1]>pcode1[1],true);

		assert.equal(pd.getDBName(pcode1[1]),"db2");
		assert.equal(pd.getDBName(pcode2[1]),"db3");
	});

	it("getting external payload",function(){
		var db2=API.open("db2");
		var db3=API.open("db3");

		var pcode1=db2.pcodeFromSpan(1,2);
		var payload={"tag":"synonym22"};
		var relcode=db2.addRel(payload,pcode1);


		var py=db3.getPayload( [relcode, "db2"] );
		assert.deepEqual(py,payload);

		//create external dbid
		var externalspan=db3.pcodeFromSpan(1,1,"db2");

		var py2=db3.getPayload( [pcode, externalspan[1] ] );
		assert.deepEqual(py2,payload);
	});

	it("serialization",function(){
		var db=API.open("db4");
		var pcode1=db.pcodeFromSpan(1,2);
		var payload={"tag":"synonym1"};
		var relcode=db.addRel(payload,pcode1);

		var str=db.saveToString();
		var db2=API.loadFromString("db5",str);

		var rels=db2.by(pcode1);
		assert.deepEqual(rels,db.by(pcode1));
	})

});
