"""CLIP robustness audit using tensor input perturbations; no source images are modified."""
import json
import sys
from pathlib import Path
import torch
import torch.nn.functional as F
from PIL import Image
from transformers import CLIPModel, CLIPProcessor

BASE=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(BASE))
from matching.image_matcher import resolve_image_path, cosine_similarity, MODEL_NAME
from matching.date_utils import is_chronologically_valid
from run_checks import metrics, ranking


def main():
    torch.set_num_threads(4)
    read=lambda p: json.loads((BASE/p).read_text())
    lost,found=read('data/lost_items.json'),read('data/found_items.json')
    truth={(r['lost_item_id'],r['found_item_id']) for r in read('evaluation/ground_truth.json') if r['is_match']}
    processor=CLIPProcessor.from_pretrained(MODEL_NAME)
    model=CLIPModel.from_pretrained(MODEL_NAME).eval()
    valid_lost=[r for r in lost if resolve_image_path(r)]
    valid_found=[r for r in found if resolve_image_path(r)]
    def pixels(items):
        tensors=[]
        for row in items:
            with Image.open(resolve_image_path(row)) as im:
                tensors.append(processor(images=im.convert('RGB'),return_tensors='pt')['pixel_values'][0])
        return torch.stack(tensors)
    def embed(tensor):
        vectors=[]
        for batch in tensor.split(8):
            with torch.inference_mode():
                features=model.get_image_features(pixel_values=batch)
                if hasattr(features,'pooler_output'):
                    features=features.pooler_output
                vectors.extend(F.normalize(features,p=2,dim=-1).tolist())
        return vectors
    a,b=pixels(valid_lost),pixels(valid_found)
    av=embed(a)
    mean=torch.tensor(processor.image_processor.image_mean).view(1,3,1,1)
    std=torch.tensor(processor.image_processor.image_std).view(1,3,1,1)
    raw=b*std+mean
    variants={
        'original': b,
        'horizontal_flip': b.flip(-1),
        'quarter_turn': torch.rot90(b,1,(-2,-1)),
        'darkened_50_percent': (raw*.5-mean)/std,
        'center_crop_70_percent': F.interpolate(b[:,:,34:-34,34:-34],size=b.shape[-2:],mode='bilinear',align_corners=False),
        'occluded_right_third': b.clone(),
    }
    variants['occluded_right_third'][:,:,:,150:]=0
    report={'notes':['Synthetic perturbations of found-image tensors after CLIP preprocessing; not new photographs or validation of viewpoint robustness.','All lost items remain unchanged; same candidate/date filtering as original matcher.'], 'scenarios':{}}
    for name,tensor in variants.items():
        bv=embed(tensor)
        rows=[]
        for x,v in zip(valid_lost,av):
            for y,w in zip(valid_found,bv):
                if is_chronologically_valid(x,y):
                    rows.append({'lost_item_id':x['id'],'found_item_id':y['id'],'cosine_similarity':round(cosine_similarity(v,w),6)})
        report['scenarios'][name]={'pairs':len(rows),'at_0_8':metrics(rows,truth,'cosine_similarity',.8),'ranking':ranking(rows,truth,'cosine_similarity')}
        print(name,report['scenarios'][name],flush=True)
        Path(__file__).with_name('image_stress_report.json').write_text(json.dumps(report,indent=2)+'\n')

if __name__=='__main__':
    main()
