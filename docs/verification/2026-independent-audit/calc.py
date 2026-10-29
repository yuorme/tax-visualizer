# Independent 2026 tax / benefit calculator
def bracket_tax(ti, br):
    # br: list of (threshold, rate) ascending
    t=0.0
    for i,(lo,r) in enumerate(br):
        hi = br[i+1][0] if i+1<len(br) else float('inf')
        if ti>lo: t += (min(ti,hi)-lo)*r
    return t

FED=[(0,.14),(58523,.205),(117045,.26),(181440,.29),(258482,.33)]
FED_BPA=16452; CEA=1501
PROV={
 'AB':dict(br=[(0,.08),(61200,.10),(154259,.12),(185111,.13),(246813,.14),(370220,.15)],bpa=22769,ed=22769),
 'BC':dict(br=[(0,.056),(50363,.077),(100728,.105),(115648,.1229),(140430,.147),(190405,.168),(265545,.205)],bpa=13216,ed=11317),
 'MB':dict(br=[(0,.108),(47000,.1275),(100000,.174)],bpa=15780,ed=9134),
 'NB':dict(br=[(0,.094),(52333,.14),(104666,.16),(193861,.195)],bpa=13664,ed=10709),
 'NL':dict(br=[(0,.087),(44678,.145),(89354,.158),(159528,.178),(223340,.198),(285319,.208),(570638,.213),(1141275,.218)],bpa=13094,ed=9142),
 'NS':dict(br=[(0,.0879),(30995,.1495),(61991,.1667),(97417,.175),(157124,.21)],bpa=11932,ed=11932),
 'NT':dict(br=[(0,.059),(53003,.086),(106009,.122),(172346,.1405)],bpa=18198,ed=18198),
 'NU':dict(br=[(0,.04),(55801,.07),(111602,.09),(181439,.115)],bpa=19659,ed=19659),
 'ON':dict(br=[(0,.0505),(53891,.0915),(107785,.1116),(150000,.1216),(220000,.1316)],bpa=12989,ed=11029),
 'PE':dict(br=[(0,.095),(33928,.1347),(65820,.166),(106890,.1762),(142520,.19),(200000,.20)],bpa=15000,ed=12740),
 'QC':dict(br=[(0,.14),(54345,.19),(108680,.24),(132245,.2575)],bpa=18952,ed=0),
 'SK':dict(br=[(0,.105),(54532,.125),(155805,.145)],bpa=20381,ed=20381),
 'YT':dict(br=[(0,.064),(58523,.09),(117045,.109),(181440,.128),(500000,.15)],bpa=16452,ed=16452),
}
YMPE=74600; YAMPE=85000; YBE=3500
def payroll(E, prov):
    r = .063 if prov=='QC' else .0595
    rb= .053 if prov=='QC' else .0495
    pe=max(0,min(E,YMPE)-YBE)
    c1=round(pe*r,2); base=round(pe*rb,2); enh1=round(c1-base,2)
    c2=round(max(0,min(E,YAMPE)-YMPE)*.04,2)
    if prov=='QC':
        ei=round(min(E,68900)*.013,2); qpip=round(min(E,103000)*.0043,2)
    else:
        ei=round(min(E,68900)*.0163,2); qpip=0.0
    return dict(cpp=c1+c2,base=base,enh=enh1+c2,ei=ei,qpip=qpip)

def ohp(ti):
    if ti<=20000: return 0
    if ti<=36000: return min(300,.06*(ti-20000))
    if ti<=48000: return min(450,300+.06*(ti-36000))
    if ti<=72000: return min(600,450+.25*(ti-48000))
    if ti<=200000: return min(750,600+.25*(ti-72000))
    return min(900,750+.25*(ti-200000))

def person(prov, E, *, ed=False, kids_u6=0, kids_6_17=0, claim_kids=False,
           elig_div=0.0, family_ni=None, single_parent=False):
    p=payroll(E,prov)
    gross_div=elig_div*1.38
    ni = E + gross_div - p['enh']   # net income = taxable income here
    d={}
    # ---------- federal
    fcred = FED_BPA + min(CEA,E) + p['base'] + p['ei'] + p['qpip'] + (FED_BPA if ed else 0)
    fbasic = max(0, bracket_tax(ni,FED) - .14*fcred - .150198*gross_div)
    fed = fbasic*(1-.165) if prov=='QC' else fbasic
    d['fed']=fed
    # ---------- provincial
    P=PROV[prov]; br=P['br']; rate=br[0][1]
    if prov=='QC':
        dw=min(1450,.06*E)
        qni = E - dw - p['enh']
        cred = P['bpa']
        if single_parent:  # person living alone amount (living only with minor children)
            cred += max(0, 2172 - .1875*max(0,qni-42955))
        pt = max(0, bracket_tax(qni,br) - .14*cred)
        d['prov']=pt; d['qni']=qni
    else:
        cred = P['bpa'] + p['base'] + p['ei'] + (P['ed'] if ed else 0)
        if prov=='YT': cred += min(CEA,E)
        if claim_kids:
            if prov=='SK': cred += 8358*(kids_u6+kids_6_17)
            if prov in ('NS','NU'): cred += 1200*kids_u6
        pt = bracket_tax(ni,br) - rate*cred
        if prov=='ON': pt -= .10*gross_div
        pt=max(0,pt)
        surtax=0
        if prov=='ON':
            surtax = .20*max(0,pt-5818) + .36*max(0,pt-7446)
            pt += surtax
            # Ontario tax reduction
            nk = (kids_u6+kids_6_17) if claim_kids else 0
            red = max(0, 2*(300+554*nk) - pt)
            pt -= min(pt,red)
            # LIFT
            fam = family_ni if family_ni is not None else ni
            lift = max(0, min(875,.0505*E) - .05*max(ni-32500, fam-65000, 0))
            d['lift']=min(pt,lift); pt -= min(pt,lift)
            d['surtax']=surtax
        if prov=='BC':
            red = max(0, 690 - .0356*max(0,ni-25570)); pt-=min(pt,red); d['bcred']=red
        if prov=='NB':
            fam = family_ni if family_ni is not None else ni
            mx = 818 + (818 if ed else 0)
            red = max(0, mx - .03*max(0,fam-22358)); pt-=min(pt,red); d['litr']=red
        if prov=='NL':
            fam = family_ni if family_ni is not None else ni
            mx = 842 + (563 if ed else 0); thr = 40905 if ed else 24191
            red = max(0, mx - .16*max(0,fam-thr)); pt-=min(pt,red); d['litr']=red
        if prov=='PE':
            fam = family_ni if family_ni is not None else ni
            nk = kids_u6+kids_6_17
            mx = 350 + (350 if ed else 0) + 300*max(0, nk-(1 if ed else 0))
            red = max(0, mx - .05*max(0,fam-23000)); pt-=min(pt,red); d['litr']=red
        if prov=='NS':
            fam = family_ni if family_ni is not None else ni
            nk = kids_u6+kids_6_17
            mx = 300 + (300 if ed else 0) + 165*max(0,nk-(1 if ed else 0))
            red = max(0, mx - .05*max(0,fam-15000)); pt-=min(pt,red); d['litr']=red
        d['prov']=pt
    # ---------- payroll
    pay = p['cpp'] + p['ei'] + p['qpip']
    extra=0
    if prov=='ON': extra=ohp(ni); d['ohp']=extra
    if prov in ('NT','NU'): extra=.02*E; d['nwtnu']=extra
    d['payroll']=pay+extra; d['p']=p; d['ni']=ni
    return d

# ---------------- child benefits ----------------
def ccb(afni,u6,o6):
    n=u6+o6; mx=8157*u6+6883*o6
    if n==0: return 0
    t1,t2=38237,82847
    r1={1:.07,2:.135,3:.19}.get(n,.23); r2={1:.032,2:.057,3:.08}.get(n,.095)
    fx={1:3123,2:6022,3:8476}.get(n,10260)
    if afni<=t1: red=0
    elif afni<=t2: red=r1*(afni-t1)
    else: red=fx+r2*(afni-t2)
    return max(0,mx-red)

def prov_cb(prov, afni, u6, o6, single, emp_income_family):
    n=u6+o6
    if n==0: return 0,''
    if prov=='AB':
        base=[0,1529,2293,3057,3821][min(n,4)]; work=[0,782,1494,1920,2061][min(n,4)]
        b = base if afni<=28116 else max(0, base*(1-(afni-28116)/(47115-28116)))
        w = min(work, .15*max(0,emp_income_family-2760))
        if afni>47115: w=max(0,w-.15*(afni-47115))
        return b+w,'ACFB'
    if prov=='BC':
        mx=[1750,1100]+[900]*10; mn=[775,750]+[725]*10
        MX=sum(mx[:n])+(500 if single else 0); MN=sum(mn[:n])
        v=max(MN, MX-.04*max(0,afni-30176))
        if afni>96562: v=max(0,MN-.04*(afni-96562))
        return v,'BC family benefit'
    if prov=='ON': return max(0,1760*n-.08*max(0,afni-26865)),'Ontario Child Benefit'
    if prov=='QC':
        mx=3068*n+(1077 if single else 0); mn=1221*n+(430 if single else 0)
        thr=44032 if single else 60398
        v=max(mn, mx-.04*max(0,afni-thr))
        return v,'QC Family Allowance (excl. $127 school-supplies supp.)'
    if prov=='YT':
        mx=966*n; r=.025 if n==1 else .05
        return max(0,mx-r*max(0,afni-35000)),'Yukon child benefit'
    if prov=='NT':
        C=[0,815,1467,1997,2445][min(n,4)] if False else None
        # per NWT formula: C = amount for # of under-6 kids, D = amount for # of 6-17 kids
        tabu=[0,815,1467,1997,2445]; tabo=[0,652,1174,1597,1956]
        C=tabu[u6]; D=tabo[o6]; tot=C+D
        if afni<=30000: return tot,'NWT child benefit'
        return max(0, tot - (afni-30000)*tot/50000),'NWT child benefit'
    if prov=='NU':
        r=.03 if n==1 else .05
        return max(0,696*n - r*max(0,afni-22065)),'Nunavut child benefit'
    if prov=='PE':
        per = 410 if afni<45000 else (290 if afni<=80000 else 0)
        return per*n,'PEI child benefit'
    if prov=='NS':
        return (1525*n if afni<=26000 else (0 if afni>=34000 else None)),'NS child benefit'
    if prov=='NB':
        return (0 if afni>=30000 else None),'NB child tax benefit + WIS'
    if prov=='NL':
        return (0 if afni>38193 else None),'NL child benefit (+PECNS)'
    if prov=='MB':
        return (0 if afni>20435 else None),'Manitoba Child Benefit'
    if prov=='SK':
        return 0,'none (SK has no child benefit)'

ORDER=['AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT']
def show(title, rows):
    print('\n'+title)
    print(f"{'Prov':4} {'Fed':>9} {'Prov':>9} {'Payroll':>9} {'CCB':>9} {'ProvCB':>9} {'NET':>10}  payroll detail / prov CB program")
    for r in rows:
        print(f"{r[0]:4} {r[1]:9.2f} {r[2]:9.2f} {r[3]:9.2f} {r[4]:9.2f} {r[5]:9.2f} {r[6]:10.2f}  {r[7]}")

# S1
rows=[]
for pr in ORDER:
    d=person(pr,75000)
    p=d['p']
    det=f"CPP/QPP {p['cpp']:.2f} EI {p['ei']:.2f}"+(f" QPIP {p['qpip']:.2f}" if p['qpip'] else '')+(f" OHP {d['ohp']:.2f}" if 'ohp' in d else '')+(f" 2%tax {d['nwtnu']:.2f}" if 'nwtnu' in d else '')
    rows.append((pr,d['fed'],d['prov'],d['payroll'],0,0,d['fed']+d['prov']+d['payroll'],det+f" | NI {d['ni']:.2f}"))
show('S1 single 75,000',rows)

# S2
rows=[]
for pr in ORDER:
    a=person(pr,70000,kids_u6=1,kids_6_17=1,claim_kids=True,family_ni=None)
    b=person(pr,50000,kids_u6=1,kids_6_17=1,claim_kids=False)
    fam=a['ni']+b['ni']
    # re-run with family NI for income-tested reductions
    a=person(pr,70000,kids_u6=1,kids_6_17=1,claim_kids=True,family_ni=fam)
    b=person(pr,50000,kids_u6=1,kids_6_17=1,claim_kids=False,family_ni=fam)
    c=ccb(120000,1,1); pc,name=prov_cb(pr,120000,1,1,False,120000)
    pc=pc or 0
    fed=a['fed']+b['fed']; pv=a['prov']+b['prov']; pay=a['payroll']+b['payroll']
    det=f"A pay {a['payroll']:.2f} (CPP {a['p']['cpp']:.2f} EI {a['p']['ei']:.2f} QPIP {a['p']['qpip']:.2f} OHP {a.get('ohp',0):.2f} 2% {a.get('nwtnu',0):.2f}); B pay {b['payroll']:.2f} (CPP {b['p']['cpp']:.2f} EI {b['p']['ei']:.2f} QPIP {b['p']['qpip']:.2f} OHP {b.get('ohp',0):.2f} 2% {b.get('nwtnu',0):.2f}) | fedA {a['fed']:.2f} fedB {b['fed']:.2f} provA {a['prov']:.2f} provB {b['prov']:.2f} | {name}"
    rows.append((pr,fed,pv,pay,c,pc,fed+pv+pay-c-pc,det))
show('S2 couple 70k+50k, kids <6 and 6-17',rows)

# S3
rows=[]
for pr in ORDER:
    d=person(pr,40000,ed=True,kids_u6=2,claim_kids=True,single_parent=True)
    c=ccb(40000,2,0); pc,name=prov_cb(pr,40000,2,0,True,40000)
    pc = pc if pc is not None else float('nan')
    p=d['p']
    det=f"CPP/QPP {p['cpp']:.2f} EI {p['ei']:.2f}"+(f" QPIP {p['qpip']:.2f}" if p['qpip'] else '')+(f" OHP {d['ohp']:.2f}" if 'ohp' in d else '')+(f" 2%tax {d['nwtnu']:.2f}" if 'nwtnu' in d else '')
    extra=' '.join(f"{k} {d[k]:.2f}" for k in ('litr','bcred','lift') if k in d)
    rows.append((pr,d['fed'],d['prov'],d['payroll'],c,pc,d['fed']+d['prov']+d['payroll']-c-pc,det+f" | NI {d['ni']:.2f} {extra} | {name}"))
show('S3 single parent 40k, 2 kids <6',rows)

# S4
d=person('ON',150000,elig_div=20000)
print('\nS4 ON 150k + 20k elig div:', {k:(round(v,2) if isinstance(v,float) else v) for k,v in d.items() if k!='p'}, d['p'])
