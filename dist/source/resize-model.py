import sys
from pathlib import Path
base=Path(__file__).parent;sys.path.insert(0,str(base/'python'))
import onnx,numpy as np
from onnx import numpy_helper
size=640;count=sum((size//s)**2 for s in (8,16,32))
m=onnx.load(base/'holds.onnx');m.graph.input[0].type.tensor_type.shape.dim[2].dim_value=size;m.graph.input[0].type.tensor_type.shape.dim[3].dim_value=size;m.graph.output[0].type.tensor_type.shape.dim[2].dim_value=count
grids=[];strides=[]
for stride in (8,16,32):
 y,x=np.mgrid[:size//stride,:size//stride];grids.append(np.stack([x.reshape(-1)+.5,y.reshape(-1)+.5]).astype(np.float32));strides.extend([stride]*(size//stride)**2)
for tensor in m.graph.initializer:
 a=numpy_helper.to_array(tensor)
 if tensor.name=='/model.22/Constant_9_output_0':a=np.concatenate(grids,axis=1)[None]
 elif tensor.name=='/model.22/Constant_12_output_0':a=np.array([strides],dtype=np.float32)
 elif tensor.name in ['/model.22/dfl/Constant_output_0','/model.22/dfl/Constant_1_output_0']:a=np.where(a==134400,count,a)
 else:continue
 tensor.CopyFrom(numpy_helper.from_array(a,tensor.name))
del m.graph.value_info[:]
onnx.checker.check_model(m);onnx.save(m,base/'holds-640.onnx')
print('Saved 640px resolution variant; learned parameters unchanged.')
