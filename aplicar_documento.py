import re, sqlite3, unicodedata, sys
norm=lambda s:re.sub(r'\s+',' ',''.join(c for c in unicodedata.normalize('NFD',s.lower()) if unicodedata.category(c)!='Mn')).strip()
alias=lambda n:[x.strip() for x in norm(n).split('/') if x.strip()]
quita=lambda s:re.sub(r'^ingenieria (en|de) |^ingenieria ','',s)
def split_sent(t):
    t=t.strip(); out=[]; depth=0; cur=''
    for i,ch in enumerate(t):
        cur+=ch
        if ch=='(':depth+=1
        elif ch==')':depth=max(0,depth-1)
        elif ch=='.' and depth==0 and i+1<len(t) and t[i+1]==' ' and i+2<len(t) and re.match(r'[A-ZÁÉÍÓÚÑ¿"]',t[i+2]) and not re.search(r'\b(N|Dr|Sr|ed)\.$',cur):
            out.append(cur.strip());cur=''
    if cur.strip():out.append(cur.strip())
    return [s.rstrip('.').strip() for s in out if s.strip(' .')]
def titulo(s):
    m=re.match(r'^([^:(]{6,80}):',s)
    if m:return m.group(1).strip()
    m=re.match(r'^([^(]{12,90})\(',s)
    t=(m.group(1) if m else s).strip().rstrip(',')
    return t if len(t)<=90 else t[:90].rsplit(' ',1)[0]
def parse(path):
    areas=[];a=c=s=None
    for ln in open(path,encoding='utf-8'):
        ln=ln.rstrip('\n')
        if ln.startswith('## '):a={'n':ln[3:].strip(),'c':[]};areas.append(a)
        elif ln.startswith('### '):c={'n':ln[4:].strip(),'m':[],'b':[]};a['c'].append(c)
        elif ln.startswith('* '):
            n,_,t=ln[2:].partition(':');s={'n':n.strip(),'t':t.strip(),'sub':[]};c['m'].append(s)
        elif ln.startswith('  - '):
            n,_,t=ln[4:].partition(':');s['sub'].append((n.strip(),t.strip()))
        elif ln.startswith('> '):c['b'].append(ln[2:].strip())
    return areas
areas=parse('plan_documento.md')
db=sqlite3.connect('data/preuniversitario.db');db.execute('PRAGMA foreign_keys=ON')
abd={norm(r[1]):r[0] for r in db.execute('select id,name from areas_academicas')}
stats=dict(nuevas=0,mat=0,mod=0,sin=[]);claimed={};sistemas=None
for a in areas:
    aid=abd[norm(a['n'])]
    pos_c=db.execute('select coalesce(max(position),0) from carreras where faculty_id=?',(aid,)).fetchone()[0]
    for c in a['c']:
        cands=db.execute('select id,name from carreras where faculty_id=?',(aid,)).fetchall()
        al=alias(c['n'])
        hit=[x for x in cands if any(y in al for y in alias(x[1]))]
        if not hit:hit=[x for x in cands if any(quita(y)==quita(z) for y in alias(x[1]) for z in al)]
        if not hit:hit=[x for x in cands if any(len(y)>=8 and (norm(x[1]).startswith(y) or y.startswith(norm(x[1]))) for y in al)]
        hit=[x for x in hit if claimed.get(x[0],c['n'])==c['n']]
        if not hit:
            pos_c+=1
            cid=db.execute('insert into carreras(faculty_id,name,description,position) values(?,?,?,?)',(aid,c['n'],f"Preparación para el examen de admisión de {c['n']}: materias y temas según el temario de referencia.",pos_c)).lastrowid
            hit=[(cid,c['n'])];stats['nuevas']+=1;print('NUEVA',c['n'])
        for h in hit:claimed[h[0]]=c['n']
        if c['n']=='Ingeniería de Sistemas':
            for h in hit:db.execute('update carreras set name=? where id=?',('Ingeniería de Sistemas',h[0]))
        for h in hit:
            cid=h[0]
            for (sid,) in db.execute('select id from materias where career_id=?',(cid,)).fetchall():
                db.execute('delete from materias where id=?',(sid,))
            def addmat(nombre,mods,k):
                low=lambda x:x[0].lower()+x[1:] if len(x)>1 and x[1].islower() else x
                desc=('Libros y documentos sugeridos para esta carrera.' if nombre.startswith('Bibliografía') else 'Temas: '+', '.join(low(m[0]) for m in mods[:4])+(' y más.' if len(mods)>4 else '.'))
                sid=db.execute('insert into materias(career_id,name,description,position) values(?,?,?,?)',(cid,nombre,desc,k)).lastrowid
                for i,(t,sm,ct) in enumerate(mods,1):
                    db.execute('insert into modulos(subject_id,title,summary,content,position) values(?,?,?,?,?)',(sid,t,sm,ct,i));stats['mod']+=1
                stats['mat']+=1
            k=0
            for m in c['m']:
                k+=1;mods=[]
                items=[(n,t) for n,t in m['sub']] if m['sub'] else [(None,x) for x in split_sent(m['t'])]
                for n,t in items:
                    if n:
                        ss=split_sent(t);tt=n;sm=(n+': '+'. '.join(ss))[:240]
                        ct=f"{n}. Contenidos: "+'. '.join(ss)+f".\n\nTema de «{m['n']}» del temario de admisión de {c['n']}. El material de estudio detallado será agregado por el profesor."
                    else:
                        tt=titulo(t);sm=t[:240]
                        ct=t+f".\n\nTema de «{m['n']}» del temario de admisión de {c['n']}. El material de estudio detallado será agregado por el profesor."
                    mods.append((tt,sm,ct))
                addmat(m['n'],mods,k)
            if c['b']:
                addmat('Bibliografía recomendada',[('Bibliografía recomendada','Libros y documentos sugeridos para preparar las materias de '+c['n']+'.','\n'.join('• '+b for b in c['b']))],k+1)
db.commit();print(stats)
for r in db.execute("select c.id,c.name,(select count(*) from materias m where m.career_id=c.id) from carreras c where not exists (select 1 from materias m join modulos x on x.subject_id=m.id where m.career_id=c.id and m.name='Bibliografía recomendada')"):print('SIN PLAN',r)
print(db.execute('select count(*) from carreras').fetchone(),db.execute('select count(*) from materias').fetchone(),db.execute('select count(*) from modulos').fetchone())
