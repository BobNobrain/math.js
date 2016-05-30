function isGroupElement(obj)
{
	if(typeof obj.add != typeof eval) return false;
	if(typeof obj.mul != typeof eval) return false;
	return true;
}

function isAdditive(obj)
{
	return	 typeof obj.add == typeof eval			||
			(typeof obj == typeof 0) && !isNaN(obj) ||
			 typeof obj == typeof ''; }

function isMultiplicative(obj)
{
	return   typeof obj.mul == typeof eval 			||
			(typeof obj == typeof 0) && !isNaN(obj);
}

function abstractMul()
{
	return Array.from(arguments).reduce(abstractMul2);
}
function abstractMul2(a, b)
{
	if(!isMultiplicative(a)) return NaN;
	if(!isMultiplicative(b)) return NaN;

	let types = (typeof a)[0]+(typeof b)[0];
	let cases = {
		'nn': (n1, n2) => n1*n2,
		'no': (n, o) => o.mul(n),
		'on': (o, n) => o.mul(n),
		'oo': (o1, o2) => o1.mul(o2)
	};

	return cases[types](a, b);
}

function abstractAdd()
{
	return Array.from(arguments).reduce(abstractAdd2);
}
function abstractAdd2(a, b)
{
	if(!isAdditive(a)) return NaN;
	if(!isAdditive(b)) return NaN;

	let types = (typeof a)[0]+(typeof b)[0];
	let cases = {
		'nn': (n1, n2) => n1+n2,
		'ss': (s1, s2) => s1+s2,
		'oo': (o1, o2) => o1.add(o2),

		'no': (n, o) => o.add(n),
		'on': (o, n) => o.add(n),

		'so': (s, o) => o.add(s),
		'os': (o, s) => o.add(s),

		'ns': (n, s) => n+s,
		'sn': (s, n) => n+s
	};

	return cases[types](a, b);
}
