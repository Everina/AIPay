"""Hand-built interpretation of the supplied seal drawing; no image upload.

Builds a smooth implicit body and separate closed detail meshes into glTF 2.0.
Requires numpy. All coordinates are in meters, with Y up and the face toward +Z.
"""
import json
import math
import struct
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'dist/models'
OUT.mkdir(exist_ok=True)
parts = []

def smooth_min(a, b, k):
    h = np.maximum(k - np.abs(a-b), 0) / k
    return np.minimum(a,b) - h*h*k*.25

def ellipsoid_field(p, center, radii):
    q = (p-np.array(center)) / np.array(radii)
    return (np.linalg.norm(q, axis=-1)-1) * min(radii)

def body_field(p):
    a = ellipsoid_field(p, [-.77, 1.23, -.035], [1.30, 1.31, .87])
    b = ellipsoid_field(p, [.96, 1.00, .06], [1.02, .98, .92])
    d = smooth_min(a,b,.40)
    # Rounded contact with the ground, rather than a floating sphere.
    return -smooth_min(-d, p[...,1]-.035, .12)

def gradient(p):
    delta = np.eye(3)*.0002
    g = np.stack([body_field(p+d)-body_field(p-d) for d in delta], axis=-1)
    return g / np.maximum(np.linalg.norm(g,axis=-1,keepdims=True),1e-12)

def add(name, positions, normals, indices, material=0):
    parts.append((name,np.asarray(positions,dtype='<f4'),np.asarray(normals,dtype='<f4'),np.asarray(indices,dtype='<u4').reshape(-1),material))

def body():
    # Six consistent tetrahedra per voxel, interpolated at the zero isosurface.
    xs=np.linspace(-2.42,2.10,89); ys=np.linspace(-.09,2.70,63); zs=np.linspace(-1.06,1.10,49)
    grid=np.stack(np.meshgrid(xs,ys,zs,indexing='ij'),axis=-1)
    offsets=[(0,0,0),(1,0,0),(1,1,0),(0,1,0),(0,0,1),(1,0,1),(1,1,1),(0,1,1)]
    cells=np.stack([grid[a:a+len(xs)-1,b:b+len(ys)-1,c:c+len(zs)-1].reshape(-1,3) for a,b,c in offsets],axis=1)
    vals=body_field(cells)
    active=(vals.min(axis=1)<0)&(vals.max(axis=1)>0)
    cells,vals=cells[active],vals[active]
    triangles=[]
    for ids in [(0,1,2,6),(0,2,3,6),(0,3,7,6),(0,7,4,6),(0,4,5,6),(0,5,1,6)]:
        v=cells[:,ids]; f=vals[:,ids]
        masks=((f<0)*np.array([1,2,4,8])).sum(axis=1)
        for mask in range(1,15):
            pick=masks==mask
            if not pick.any(): continue
            vv,ff=v[pick],f[pick]
            inside=[n for n in range(4) if mask&(1<<n)]
            outside=[n for n in range(4) if not mask&(1<<n)]
            def edge(a,b):
                t=ff[:,a]/(ff[:,a]-ff[:,b])
                return vv[:,a]+t[:,None]*(vv[:,b]-vv[:,a])
            if len(inside)==1 or len(outside)==1:
                lone,others=(inside[0],outside) if len(inside)==1 else (outside[0],inside)
                triangles.append(np.stack([edge(lone,k) for k in others],axis=1))
            else:
                a,b=inside; c,d=outside
                ac,ad,bc,bd=edge(a,c),edge(a,d),edge(b,c),edge(b,d)
                triangles.extend([np.stack([ac,ad,bc],axis=1),np.stack([ad,bd,bc],axis=1)])
    tris=np.concatenate(triangles)
    normal=np.cross(tris[:,1]-tris[:,0],tris[:,2]-tris[:,0])
    flip=(normal*gradient(tris.mean(axis=1))).sum(axis=1)<0
    tris[flip]=tris[flip][:,[0,2,1]]
    v,idx=np.unique(np.round(tris.reshape(-1,3),6),axis=0,return_inverse=True)
    add('Seal / continuous body',v,gradient(v),idx)

def sphere(name, center, radii, material=0, ry=0, rz=0, heart=False):
    nu,nv=64,32
    p=[]; n=[]
    cy,sy=math.cos(ry),math.sin(ry); cz,sz=math.cos(rz),math.sin(rz)
    rot=np.array([[cz,-sz,0],[sz,cz,0],[0,0,1]]) @ np.array([[cy,0,sy],[0,1,0],[-sy,0,cy]])
    for j in range(nv+1):
        lat=math.pi*j/nv
        for i in range(nu+1):
            t=2*math.pi*i/nu
            if heart:
                x=math.sin(t)**3
                y=(13*math.cos(t)-5*math.cos(2*t)-2*math.cos(3*t)-math.cos(4*t))/17
                q=np.array([x*math.sin(lat),y*math.sin(lat),math.cos(lat)])
            else: q=np.array([math.sin(lat)*math.cos(t),math.sin(lat)*math.sin(t),math.cos(lat)])
            p.append(rot@(q*np.array(radii))+np.array(center))
            nn=rot@(q/np.array(radii)); n.append(nn/max(np.linalg.norm(nn),1e-12))
    indices=[]
    for j in range(nv):
        for i in range(nu):
            a=j*(nu+1)+i; b=a+nu+1
            indices.extend([a,b,a+1,a+1,b,b+1])
    p=np.array(p); idx=np.array(indices).reshape(-1,3)
    # Heart parameterization reverses the winding; compute its smooth normals.
    if heart:
        idx=idx[:,[0,2,1]]
        ns=np.zeros_like(p)
        fn=np.cross(p[idx[:,1]]-p[idx[:,0]],p[idx[:,2]]-p[idx[:,0]])
        for col in range(3): np.add.at(ns,idx[:,col],fn)
        n=ns/np.maximum(np.linalg.norm(ns,axis=1,keepdims=True),1e-12)
    add(name,p,n,idx,material)

def surface_z(x,y):
    lo,hi=0.,1.6
    for _ in range(32):
        mid=(lo+hi)/2
        if body_field(np.array([x,y,mid]))<0: lo=mid
        else: hi=mid
    return (lo+hi)/2

def tube(name, control, radius=.048, material=1):
    c=np.array(control); points=[]
    padded=np.concatenate([c[:1],c,c[-1:]])
    for i in range(1,len(padded)-2):
        a,b,d,e=padded[i-1:i+3]
        for t in np.linspace(0,1,14,endpoint=False):
            xy=.5*((2*b)+(-a+d)*t+(2*a-5*b+4*d-e)*t*t+(-a+3*b-3*d+e)*t*t*t)
            points.append([*xy,surface_z(*xy)+.025])
    xy=c[-1]; points.append([*xy,surface_z(*xy)+.025])
    points=np.array(points); tangents=np.gradient(points,axis=0)
    tangents/=np.linalg.norm(tangents,axis=1,keepdims=True)
    p=[]; n=[]; idx=[]; sides=12
    for j,(pt,tangent) in enumerate(zip(points,tangents)):
        axis=np.cross(tangent,[0,0,1]); axis/=np.linalg.norm(axis)
        other=np.cross(tangent,axis)
        for k in range(sides):
            angle=k/sides*math.tau; normal=axis*math.cos(angle)+other*math.sin(angle)
            p.append(pt+radius*normal); n.append(normal)
        if j:
            for k in range(sides):
                a=(j-1)*sides+k; b=(j-1)*sides+(k+1)%sides; d=j*sides+k; e=j*sides+(k+1)%sides
                idx.extend([a,b,d,b,e,d])
    # Cap both tube ends. Spherical end caps give a soft, ink-like silhouette.
    for end in [0,len(points)-1]:
        center=len(p);p.append(points[end]);n.append(tangents[end]*(-1 if end==0 else 1))
        for k in range(sides):
            a=end*sides+k;b=end*sides+(k+1)%sides
            idx.extend([center,b,a] if end==0 else [center,a,b])
    add(name,p,n,idx,material)
    for i in [0,-1]: sphere(name+' / rounded end '+str(i),points[i],[radius]*3,material)

body()
sphere('Near flipper', [.15,.16,.89], [.66,.14,.29], ry=.62, rz=.08)
sphere('Far flipper', [1.57,.15,-.43], [.56,.12,.25], ry=-.4)
sphere('Tail / near lobe', [-1.90,.14,.32], [.64,.13,.29], ry=-.48)
sphere('Tail / far lobe', [-1.92,.14,-.32], [.56,.13,.29], ry=.5)
for label,x in [('left',.72),('right',1.35)]:
    y=1.38
    sphere('Eye / '+label,[x,y,surface_z(x,y)+.027],[.119,.125,.055],1)
x,y=1.06,1.15
sphere('Heart nose',[x,y,surface_z(x,y)+.066],[.16,.14,.075],1,heart=True)
tube('Smile / left',[(.83,1.08),(.57,1.035),(.40,.93),(.52,.82),(.77,.82),(1.085,.94)],.054)
tube('Smile / right',[(1.085,.94),(1.34,.82),(1.58,.82),(1.73,.93),(1.60,1.035),(1.34,1.08)],.054)

materials=[
 {'name':'Ivory porcelain','pbrMetallicRoughness':{'baseColorFactor':[.94,.93,.90,1],'metallicFactor':.06,'roughnessFactor':.27}},
 {'name':'Ink black','pbrMetallicRoughness':{'baseColorFactor':[.008,.011,.010,1],'metallicFactor':.0,'roughnessFactor':.31}}
]
def export_glb(filename, root_name, meshes, materials):
    doc={'asset':{'version':'2.0','generator':'Zimi / procedural character sculpture'},'scene':0,'scenes':[{'nodes':[0]}],
     'nodes':[{'name':root_name,'children':[]}],'meshes':[],'materials':materials,'buffers':[], 'bufferViews':[],'accessors':[],
     'extras':{'reference':'User-supplied seal and diamond-hole coin drawings','interpretation':'Rounded reconstruction; unseen back inferred. Independent objects, no rig.'}}
    binary=bytearray()
    def accessor(arr,typ,component,target,bounds=False):
        while len(binary)%4: binary.append(0)
        offset=len(binary); raw=arr.tobytes(); binary.extend(raw)
        vi=len(doc['bufferViews']);doc['bufferViews'].append({'buffer':0,'byteOffset':offset,'byteLength':len(raw),'target':target})
        ac={'bufferView':vi,'componentType':component,'count':len(arr),'type':typ}
        if bounds: ac.update(min=arr.min(axis=0).tolist(),max=arr.max(axis=0).tolist())
        ai=len(doc['accessors']);doc['accessors'].append(ac);return ai
    for name,p,n,idx,mat in meshes:
        pa=accessor(p,'VEC3',5126,34962,True);na=accessor(n,'VEC3',5126,34962);ia=accessor(idx,'SCALAR',5125,34963)
        mesh=len(doc['meshes']);doc['meshes'].append({'name':name,'primitives':[{'attributes':{'POSITION':pa,'NORMAL':na},'indices':ia,'material':mat}]})
        node=len(doc['nodes']);doc['nodes'].append({'name':name,'mesh':mesh});doc['nodes'][0]['children'].append(node)
    doc['buffers']=[{'byteLength':len(binary)}]
    data=json.dumps(doc,separators=(',',':'),ensure_ascii=True).encode()
    data+=b' '*((-len(data))%4);binary+=b'\0'*((-len(binary))%4)
    total=12+8+len(data)+8+len(binary)
    (OUT/filename).write_bytes(struct.pack('<III',0x46546c67,2,total)+struct.pack('<II',len(data),0x4e4f534a)+data+struct.pack('<II',len(binary),0x004e4942)+binary)
    print(json.dumps({'file':str(OUT/filename),'bytes':total,'meshes':len(meshes),'triangles':sum(len(i)//3 for _,_,_,i,_ in meshes)},indent=2))

export_glb('seal.glb', 'Seal_raised_haunches', parts, materials)
parts=[]
# Closed annular solid. The inner wall follows a diamond, so the hole is geometry.
segments=192
positions=[]
profile=[('outer',-.026,.105),('inner',.028,.105),('inner',.008,.093),('inner',0,.070),
         ('inner',0,-.070),('inner',.008,-.093),('inner',.028,-.105),('outer',-.026,-.105),
         ('outer',-.006,-.09),('outer',0,-.065),('outer',0,.065),('outer',-.006,.09)]
for kind,offset,z in profile:
    for i in range(segments):
        t=math.tau*i/segments
        # Softened diamond corners retain the hand-drawn reference silhouette.
        r=.335/(abs(math.cos(t))+abs(math.sin(t))) if kind=='inner' else .69
        positions.append([(r+offset)*math.cos(t),(r+offset)*math.sin(t),z])
p=np.array(positions);indices=[]
for j in range(len(profile)):
    for i in range(segments):
        a=j*segments+i;b=j*segments+(i+1)%segments
        c=((j+1)%len(profile))*segments+i;d=((j+1)%len(profile))*segments+(i+1)%segments
        indices.extend([[a,b,c],[b,d,c]])
idx=np.array(indices);n=np.zeros_like(p)
fn=np.cross(p[idx[:,1]]-p[idx[:,0]],p[idx[:,2]]-p[idx[:,0]])
for col in range(3):np.add.at(n,idx[:,col],fn)
n/=np.maximum(np.linalg.norm(n,axis=1,keepdims=True),1e-12)
add('Gold coin / beveled diamond aperture',p,n,idx)
# A fine raised rim catches light on each face without covering the aperture.
for z in [-.108,.108]:
    p=[];n=[];idx=[]
    for i in range(segments):
        t=math.tau*i/segments
        for j in range(10):
            v=math.tau*j/10; r=.615+.009*math.cos(v)
            p.append([r*math.cos(t),r*math.sin(t),z+.009*math.sin(v)])
            n.append([math.cos(v)*math.cos(t),math.cos(v)*math.sin(t),math.sin(v)])
    for i in range(segments):
        for j in range(10):
            a=i*10+j;b=((i+1)%segments)*10+j;c=i*10+(j+1)%10;d=((i+1)%segments)*10+(j+1)%10
            idx.extend([a,b,c,b,d,c])
    add('Fine rim / '+str(z),p,n,idx,1)
export_glb('coin.glb','Coin_independent',parts,[
 {'name':'Satin gold','pbrMetallicRoughness':{'baseColorFactor':[.95,.61,.12,1],'metallicFactor':.72,'roughnessFactor':.25}},
 {'name':'Polished edge','pbrMetallicRoughness':{'baseColorFactor':[1,.78,.30,1],'metallicFactor':.80,'roughnessFactor':.19}}
])
