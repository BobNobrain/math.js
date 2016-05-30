class Mat
{
	get cellsCount() { return this.rows*this.cols; }

	constructor(rows=2, cols=2, initialValue)
	{
		if(arguments.length < 3) initialValue = 0;

		let array = Array.isArray(initialValue);
		let array2d = array? Array.isArray(initialValue[0]) : false;

		this.data=[];

		for(let i=0; i<rows; i++)
		{
			var row=[];
			for(let j=0; j<cols; j++)
			{
				if(!array) row.push(initialValue);
				else if(array2d) row.push(initialValue[i][j]);
				else row.push(initialValue[i*cols + j]);
			}
			this.data.push(row);
		}
		this.rows=rows;
		this.cols=cols;

		this.typename='Mat';
	}

	cell(row, col, val)
	{
		var old=this.data[row][col];
		if(val !== undefined)
		{
			this.data[row][col]=val;
		}
		return old;
	}

	row(rowNum)
	{
		let result = new Mat(1, this.cols);
		for(let i=0; i<this.cols; i++)
		{
			result.data[0][i]=this.data[rowNum][i];
		}
		return result;
	}

	col(colNum)
	{
		let result = new Mat(this.rows, 1);
		for(let i=0; i<this.rows; i++)
		{
			result.data[i][0]=this.data[i][colNum];
		}
		return result;
	}

	submat(startRow, startCol, numRows, numCols)
	{
		let result = new Mat(numRows, numCols, undefined);

		if(startRow + numRows > this.rows) numRows=this.rows - startRow;
		if(startCol + numCols > this.cols) numCols=this.cols - startCol;

		for(let row = 0; row < numRows; ++row)
		{
			for(let col = 0; col < numCols; ++col)
			{
				result.data[row][col] = this.data[startRow + row][startCol + col];
			}
		}

		return result;
	}

	transpose()
	{
		var transData=[];
		for(let col = 0; col < this.rows; ++col)
		{
			transData.push([]);
			for(let row = 0; row < this.cols; ++row)
			{
				transData[col].push(this.data[row][col]);
			}
		}
		this.data=transData;
		return this;
	}

	add(mat)
	{
		if(typeof mat == typeof 0 || typeof mat == typeof '')
		{
			mcons.warning('Adding a single value to Mat is not a good idea');
			return this.map(value => value+mat);
		}
		if(mat.typename == this.typename)
		{
			if(this.rows == mat.rows && this.cols == mat.cols)
			{
				return this.map((item, row, col) => abstractAdd2(item, mat.data[row][col]));
			}
			throw new Error(`Can't add Mat(${this.rows}; ${this.cols}) to Mat(${mat.rows}; ${mat.cols})!`);
		}
		try
		{
			mat.add(this);
		}
		catch(ex)
		{
			throw new Error('Trying to add incompatible types: Mat+'+mat.typename);
		}
		return NaN;
	}

	mul(mat)
	{
		// TODO
	}

	get det()
	{
		if(this.cols != this.rows) return undefined;
		if(this.rows==2) return this.data[0][0]*this.data[1][1] - this.data[0][1]*this.data[1][0];

		let result=0;
		for(let i=0; i<this.rows; i++)
		{
			if(this.data[i][0] === 0) continue;
			if(typeof result != typeof 0) return NaN;
			let submat = new Mat(this.rows-1, this.cols-1);
			for(let row = 0; row < this.rows; ++row)
			{
				if(row == i) continue;
				let subrow = row;
				if(row > i) --subrow;
				for(let col = 1; col < this.cols; ++col)
				{
					submat.data[subrow][col-1]=this.data[row][col];
				}
			}
			result += this.data[i][0] * (i%2==0? submat.det : -submat.det);
		}
		return result;
	}

	copy()
	{
		return new Mat(this.rows, this.cols, this.data);
	}

	toArray()
	{
		let result = [];
		for(let row = 0; row < this.rows; ++row)
			result=result.concat(this.data[row]);
		return result;
	}

	forEach(action, thisArg=this)
	{
		if(typeof action != typeof eval) throw new Error('type mismatch. "action" should be a function!');
		for(let row = 0; row < this.rows; ++row)
		{
			for(let col = 0; col < this.cols; ++col)
			{
				action.call(thisArg, this.data, row, col, this);
			}
		}
	}
	map(mapping, thisArg=this)
	{
		if(typeof mapping != typeof eval) throw new Error('type mismatch. "mapping" should be a function!');
		let result = new Mat(this.rows, this.cols);
		for(let row = 0; row < this.rows; ++row)
		{
			for(let col = 0; col < this.cols; ++col)
			{
				result.data[row][col]=mapping.call(thisArg, this.data, row, col, this);
			}
		}
	}
	some(check, thisArg=this)
	{
		if(typeof check != typeof eval) throw new Error('type mismatch. "check" should be a function!');
		for(let row = 0; row < this.rows; ++row)
		{
			for(let col = 0; col < this.cols; ++col)
			{
				if(check.call(thisArg, this.data, row, col, this)) return true;
			}
		}
		return false;
	}
	every(check, thisArg=this)
	{
		if(typeof check != typeof eval) throw new Error('type mismatch. "check" should be a function!');
		for(let row = 0; row < this.rows; ++row)
		{
			for(let col = 0; col < this.cols; ++col)
			{
				if(!check.call(thisArg, this.data, row, col, this)) return false;
			}
		}
		return true;
	}

	toString()
	{
		return `Mat(${this.rows}; ${this.cols}):\n`+this.data.map(item => item.join(', ')).join('\n');
	}

	render()
	{
		let output = new FormattedText();
		output.plain(`Mat(${this.rows}; ${this.cols}):`).br();

		/*let cases = {
			'string': s => output.string(s),
			'number': n => output.number(n+''),
			'boolean': b => output.boolean(b+''),
			''
		};*/

		for(let row = 0; row < this.rows; ++row)
		{
			//output[row == this.rows-1? 'startIndent' : 'startList']();
			output.startIndent();
			for(let col = 0; col < this.cols; ++col)
			{
				output.push(formOutput(this.data[row][col]));
				if(col != this.cols-1) output.plain(', ');
			}
			output.endBlock();
		}

		return output.render();
	}
}