var assert=require("assert");
var API=require("..").citation;
var text="<e>一交</e>\n[拼]yī jiāo\n跌倒。\n[連]亦作「一跤」。\n[引]水滸傳．第四回：「魯智深雙手把山門盡力一推，撲地攧將入來，吃了一交。」,紅樓夢．第三十一回：「一交栽在溝跟前，弄了一身泥水。」\n一次更替。\n[引]列子．湯問：「帝恐流於西極，失群聖之居。乃命禺彊使巨鼇十五舉首而戴之，迭為三番，六萬歲一交焉。」\n一回、一趟。\n[引]五代史平話．晉史．卷上：「咱卻不知得您元會武藝，既是如此，我與您廝賽一交，看取誰強誰弱。」,儒林外史．第十四回：「前前後後跑了一交，又出來坐在那茶亭內。」";
//var text="[引]說文解字：「⼁，下上通也。」{名}二一四部首之一。";

var pat=/\[引\]([^\n^。]+?)：「(.+?)」/g ;
var tokenize=require("ksana-analyzer").getAPI("simple1").tokenize;

describe("Citation",function(){
	it("extract citation",function() {
		var citations=API.extract(text,{pat:pat,startvpos:0,tokenize:tokenize});
		assert.equal(citations.length,3);
		console.log(citations)
	})
});