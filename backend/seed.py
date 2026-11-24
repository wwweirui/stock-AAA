"""Deterministic demo data for the analyst alpha tracker.

All analysts, brokerages and reports are fictional. Stock codes and names are
used only to make the market-tracking demo feel familiar. Prices are simulated
and must not be used for investment decisions.
"""
from __future__ import annotations

import json
import math
import random
from datetime import date, timedelta
from pathlib import Path

import numpy as np

from .db import connect, init_schema

SEED = 20261124

ANALYSTS = [
    {
        "id": "shen-yanzhou",
        "name": "沈砚舟",
        "firm": "华岳证券",
        "title": "科技研究首席",
        "style": "景气成长",
        "industries": ["AI 算力", "半导体", "光模块"],
        "years": 9,
        "avatar": "沈",
        "color": "#d9b46f",
        "tagline": "沿着算力景气度，寻找业绩兑现最快的环节",
        "bio": "专注硬科技产业链研究，擅长从资本开支与订单周期中定位高弹性环节。风格偏左侧，强调产业验证与盈利上修共振。",
        "style_scores": {"产业景气": 92, "估值安全": 56, "催化捕捉": 90, "风险控制": 66, "观点稳定": 80},
    },
    {
        "id": "lin-zhiyuan",
        "name": "林知远",
        "firm": "中澜证券",
        "title": "消费研究首席",
        "style": "价值成长",
        "industries": ["食品饮料", "家电", "免税"],
        "years": 11,
        "avatar": "林",
        "color": "#7fb3ff",
        "tagline": "用现金流与品牌壁垒，穿越消费周期",
        "bio": "覆盖大消费十余年，偏好具备定价权与稳定自由现金流的龙头公司，重视渠道库存与终端动销的交叉验证。",
        "style_scores": {"产业景气": 72, "估值安全": 86, "催化捕捉": 66, "风险控制": 84, "观点稳定": 88},
    },
    {
        "id": "su-nian",
        "name": "苏念",
        "firm": "云栖资本研究院",
        "title": "医药研究首席",
        "style": "创新成长",
        "industries": ["创新药", "CXO", "医疗器械"],
        "years": 8,
        "avatar": "苏",
        "color": "#5fd6c2",
        "tagline": "从临床价值出发，跟踪创新药的兑现曲线",
        "bio": "医药生物研究背景，聚焦创新药出海、临床数据读出与商业化放量。善于拆分公司管线价值，提示研发失败风险。",
        "style_scores": {"产业景气": 88, "估值安全": 60, "催化捕捉": 84, "风险控制": 62, "观点稳定": 74},
    },
    {
        "id": "gu-qinghe",
        "name": "顾清和",
        "firm": "北辰证券",
        "title": "先进制造组长",
        "style": "高端制造",
        "industries": ["新能源车", "锂电", "机器人"],
        "years": 7,
        "avatar": "顾",
        "color": "#e08f71",
        "tagline": "在制造升级的斜率里，寻找第二增长曲线",
        "bio": "机械与电新复合背景，重点跟踪产能周期、海外份额与新技术渗透率。对机器人产业链的边际变化保持高频跟踪。",
        "style_scores": {"产业景气": 86, "估值安全": 64, "催化捕捉": 82, "风险控制": 60, "观点稳定": 70},
    },
    {
        "id": "tang-mingchuan",
        "name": "唐明川",
        "firm": "东海联合",
        "title": "周期与金融首席",
        "style": "周期价值",
        "industries": ["有色金属", "银行", "能源"],
        "years": 12,
        "avatar": "唐",
        "color": "#b7a6e8",
        "tagline": "用供需缺口与股息率，定价周期资产",
        "bio": "长期覆盖资源品与金融板块，擅长将商品价格、库存周期与资产负债表结合起来判断赔率，强调下行保护。",
        "style_scores": {"产业景气": 70, "估值安全": 88, "催化捕捉": 62, "风险控制": 86, "观点稳定": 84},
    },
    {
        "id": "xu-anning",
        "name": "许安宁",
        "firm": "澄明资产",
        "title": "策略研究主管",
        "style": "红利策略",
        "industries": ["红利资产", "港股", "电信运营"],
        "years": 10,
        "avatar": "许",
        "color": "#a9c47b",
        "tagline": "在低波动资产里，构建可持续的复利",
        "bio": "自上而下与自下而上结合，关注无风险利率、股息率与盈利稳定性的相对变化，组合思路偏向绝对收益。",
        "style_scores": {"产业景气": 62, "估值安全": 90, "催化捕捉": 55, "风险控制": 88, "观点稳定": 90},
    },
]

STOCKS = {
    "300750": {"name": "宁德时代", "industry": "锂电池", "start": 238.6, "beta": 1.18, "vol": 0.018},
    "600519": {"name": "贵州茅台", "industry": "白酒", "start": 1398.0, "beta": 0.72, "vol": 0.012},
    "300308": {"name": "中际旭创", "industry": "光模块", "start": 186.4, "beta": 1.42, "vol": 0.025},
    "601899": {"name": "紫金矿业", "industry": "有色金属", "start": 19.86, "beta": 1.05, "vol": 0.019},
    "600276": {"name": "恒瑞医药", "industry": "创新药", "start": 51.2, "beta": 0.92, "vol": 0.016},
    "600941": {"name": "中国移动", "industry": "电信运营", "start": 112.7, "beta": 0.52, "vol": 0.009},
    "002371": {"name": "北方华创", "industry": "半导体设备", "start": 356.0, "beta": 1.35, "vol": 0.022},
    "002594": {"name": "比亚迪", "industry": "新能源车", "start": 116.5, "beta": 1.12, "vol": 0.019},
    "000333": {"name": "美的集团", "industry": "家电", "start": 73.4, "beta": 0.78, "vol": 0.013},
    "603259": {"name": "药明康德", "industry": "CXO", "start": 81.6, "beta": 1.08, "vol": 0.021},
    "002463": {"name": "沪电股份", "industry": "PCB", "start": 47.9, "beta": 1.38, "vol": 0.024},
    "600036": {"name": "招商银行", "industry": "银行", "start": 43.1, "beta": 0.66, "vol": 0.011},
    "600690": {"name": "海尔智家", "industry": "家电", "start": 31.2, "beta": 0.74, "vol": 0.013},
    "002050": {"name": "三花智控", "industry": "机器人", "start": 34.8, "beta": 1.22, "vol": 0.022},
    "300502": {"name": "新易盛", "industry": "光模块", "start": 248.0, "beta": 1.5, "vol": 0.028},
    "688235": {"name": "百济神州", "industry": "创新药", "start": 198.5, "beta": 1.16, "vol": 0.023},
    "601888": {"name": "中国中免", "industry": "免税", "start": 68.3, "beta": 0.95, "vol": 0.018},
    "600938": {"name": "中国海油", "industry": "能源", "start": 26.4, "beta": 0.68, "vol": 0.014},
    "300274": {"name": "阳光电源", "industry": "光伏储能", "start": 87.9, "beta": 1.28, "vol": 0.024},
    "300124": {"name": "汇川技术", "industry": "工控自动化", "start": 69.6, "beta": 1.06, "vol": 0.019},
    "002475": {"name": "立讯精密", "industry": "消费电子", "start": 41.8, "beta": 1.2, "vol": 0.018},
}

REPORTS = [
    {
        "id": "r01", "analyst": "gu-qinghe", "stock": "300750", "rating": "买入", "prev": "增持",
        "upside": 0.31, "date": "2026-08-05", "type": "深度研究",
        "title": "储能第二曲线加速，全球份额再上台阶",
        "tags": ["业绩超预期", "储能放量", "目标价上调"],
        "summary": "二季度储能出货环比增长 46%，海外大储订单能见度延伸至 2027 年。公司单位盈利在原材料下行周期中保持韧性，上调 2026-2028 年归母净利润预测。",
        "points": ["储能收入占比提升至 24%，成为增速最快的业务", "海外产能爬坡顺利，欧洲市占率环比提升 3.1pct", "维持全年 620GWh 出货指引，规模效应继续释放"],
        "risks": ["海外贸易政策变化", "碳酸锂价格大幅波动", "行业新增产能超预期"],
        "catalyst": 0.90, "conviction": 0.84, "bias": 0.12,
        "note": "评级由增持上调至买入，目标价较现价空间超过 30%，叠加储能订单催化，看多意图明确。",
    },
    {
        "id": "r02", "analyst": "lin-zhiyuan", "stock": "600519", "rating": "增持", "prev": "增持",
        "upside": 0.18, "date": "2026-08-07", "type": "中报点评",
        "title": "中报韧性超预期，渠道改革进入收获期",
        "tags": ["中报韧性", "渠道改革", "现金流改善"],
        "summary": "上半年营收同比增长 9.2%，直销占比提升带动毛利率改善。批价在淡季保持稳定，渠道库存处于健康区间，防御属性在当前环境下具备配置价值。",
        "points": ["二季度单季营收增长 8.7%，好于市场预期", "直销渠道占比提升至 46%，吨价结构继续优化", "经营现金流同比增长 21%，分红确定性增强"],
        "risks": ["宏观需求恢复不及预期", "批价波动", "行业政策变化"],
        "catalyst": 0.58, "conviction": 0.82, "bias": 0.10,
        "note": "维持增持但未上调评级，目标价空间约 18%，属于稳健配置型推荐而非强催化驱动。",
    },
    {
        "id": "r03", "analyst": "shen-yanzhou", "stock": "300308", "rating": "买入", "prev": "买入",
        "upside": 0.34, "date": "2026-08-14", "type": "深度研究",
        "title": "800G 放量超预期，上调全年盈利预测",
        "tags": ["AI 算力", "业绩超预期", "目标价上调"],
        "summary": "北美云厂商资本开支上修，800G 光模块三季度排产环比提升 35%。公司硅光方案良率突破带来成本优势，预计 2027 年 1.6T 产品贡献新增量。",
        "points": ["800G 出货指引由 900 万只上调至 1100 万只", "硅光模块占比提升，毛利率有望环比改善 2pct", "泰国基地投产，海外交付能力进一步增强"],
        "risks": ["云厂商资本开支下修", "光模块价格竞争加剧", "新产品验证不及预期"],
        "catalyst": 0.94, "conviction": 0.88, "bias": 0.18,
        "note": "盈利预测与目标价同步上调，产业催化密集，是本轮 AI 算力链中意图最强的推荐之一。",
    },
    {
        "id": "r04", "analyst": "tang-mingchuan", "stock": "601899", "rating": "买入", "prev": "增持",
        "upside": 0.27, "date": "2026-08-19", "type": "行业深度",
        "title": "铜金共振，资源龙头迎来量价齐升",
        "tags": ["铜金共振", "量价齐升", "目标价上调"],
        "summary": "全球铜矿供给扰动持续，冶炼加工费维持低位；黄金在降息预期下中枢上移。公司铜金双主业进入产量释放期，单位成本优势显著。",
        "points": ["2026 年铜产量指引 112 万吨，同比增长 9%", "黄金业务受益于金价中枢上移，利润弹性更大", "资产负债率降至 52%，分红比例有提升空间"],
        "risks": ["金属价格大幅回落", "海外矿山投产不及预期", "汇率波动"],
        "catalyst": 0.78, "conviction": 0.80, "bias": 0.14,
        "note": "评级上调至买入，商品价格与产量释放形成双重催化，但周期股波动较大，意图积极中带有赔率思维。",
    },
    {
        "id": "r05", "analyst": "su-nian", "stock": "600276", "rating": "买入", "prev": "增持",
        "upside": 0.29, "date": "2026-08-21", "type": "深度研究",
        "title": "创新药出海进入兑现期，管线价值重估",
        "tags": ["创新药出海", "管线兑现", "目标价上调"],
        "summary": "核心双抗产品海外 III 期达到主要终点，License-out 谈判推进顺利。国内创新药收入占比首次超过 50%，公司估值体系有望从仿制药向创新药切换。",
        "points": ["双抗产品海外峰值销售预测上调至 28 亿美元", "2026 年创新药收入占比预计达 54%", "研发费用率保持 22%，管线进入收获期"],
        "risks": ["临床数据不及预期", "海外审批进度延后", "医保谈判降价超预期"],
        "catalyst": 0.88, "conviction": 0.82, "bias": 0.11,
        "note": "关键临床数据读出叠加出海授权预期，评级上调且目标价空间充足，属于事件驱动型强看多。",
    },
    {
        "id": "r06", "analyst": "xu-anning", "stock": "600941", "rating": "增持", "prev": "增持",
        "upside": 0.14, "date": "2026-09-01", "type": "策略专题",
        "title": "红利底仓价值凸显，派息率仍有提升空间",
        "tags": ["红利防御", "派息提升", "低波动"],
        "summary": "在利率中枢下行背景下，公司 5.8% 的股息率具备吸引力。资本开支见顶后自由现金流改善，派息率有望从 72% 逐步提升至 75% 以上。",
        "points": ["移动云收入增长 18%，第二曲线保持韧性", "资本开支强度下降，自由现金流同比增长 14%", "当前股息率处于近五年 85% 分位"],
        "risks": ["利率超预期上行", "行业竞争加剧", "派息率提升不及预期"],
        "catalyst": 0.48, "conviction": 0.78, "bias": 0.03,
        "note": "推荐逻辑以股息率和防御性为主，目标空间有限，属于底仓型增持而非进攻型推票。",
    },
    {
        "id": "r07", "analyst": "shen-yanzhou", "stock": "002371", "rating": "买入", "prev": "买入",
        "upside": 0.25, "date": "2026-09-03", "type": "行业深度",
        "title": "设备国产化率加速，订单能见度再提升",
        "tags": ["半导体设备", "国产替代", "订单高增"],
        "summary": "国内晶圆厂扩产节奏好于预期，公司刻蚀与薄膜沉积设备中标份额持续提升。在手订单同比增长 42%，为 2027 年收入增长提供支撑。",
        "points": ["上半年新签订单同比增长 42%", "刻蚀设备在国内先进制程验证通过", "零部件国产化率提升，毛利率环比改善"],
        "risks": ["晶圆厂资本开支下修", "技术验证不及预期", "供应链限制"],
        "catalyst": 0.82, "conviction": 0.86, "bias": 0.13,
        "note": "订单与国产化率双重验证，维持买入并给出 25% 空间，推荐逻辑偏中期产业趋势。",
    },
    {
        "id": "r08", "analyst": "gu-qinghe", "stock": "002594", "rating": "增持", "prev": "买入",
        "upside": 0.16, "date": "2026-09-09", "type": "销量点评",
        "title": "高端化初见成效，关注海外放量节奏",
        "tags": ["高端化", "海外扩张", "评级下调"],
        "summary": "8 月销量环比增长 6%，高端品牌占比提升至 18%。但国内价格战对单车盈利形成压力，短期业绩弹性有限，下调评级至增持。",
        "points": ["高端品牌月销突破 4.2 万辆，结构改善", "海外销量同比增长 57%，泰国工厂满产", "单车净利环比下降 1200 元，价格战压力仍在"],
        "risks": ["价格战持续", "海外贸易壁垒", "新车型销量不及预期"],
        "catalyst": 0.52, "conviction": 0.68, "bias": -0.03,
        "note": "评级由买入下调至增持，虽仍看好长期出海，但短期盈利承压，推票意图明显转弱。",
    },
    {
        "id": "r09", "analyst": "lin-zhiyuan", "stock": "000333", "rating": "买入", "prev": "增持",
        "upside": 0.23, "date": "2026-09-11", "type": "中报点评",
        "title": "出海与以旧换新共振，盈利质量改善",
        "tags": ["以旧换新", "出海", "目标价上调"],
        "summary": "上半年海外收入同比增长 19%，OBM 占比提升带动毛利率改善。国内以旧换新政策拉动需求，空调排产环比回暖，上调目标价。",
        "points": ["海外 OBM 收入占比提升至 43%", "二季度毛利率同比提升 1.6pct", "经营性现金流创同期新高"],
        "risks": ["海外需求放缓", "原材料价格上涨", "汇率波动"],
        "catalyst": 0.72, "conviction": 0.82, "bias": 0.07,
        "note": "评级上调至买入，出海与政策补贴形成共振，目标价空间 23%，属于基本面改善型推荐。",
    },
    {
        "id": "r10", "analyst": "su-nian", "stock": "603259", "rating": "增持", "prev": "增持",
        "upside": 0.20, "date": "2026-09-18", "type": "订单点评",
        "title": "订单拐点确认，产能利用率触底回升",
        "tags": ["订单回暖", "产能利用率", "盈利修复"],
        "summary": "在手订单同比增长 15%，结束连续三个季度下滑。海外客户询单回暖，产能利用率回升至 72%，盈利修复路径逐步清晰。",
        "points": ["在手订单 438 亿元，同比增长 15%", "海外收入占比 64%，客户结构持续优化", "新产能投放节奏放缓，资本开支压力减轻"],
        "risks": ["地缘政治扰动", "生物医药融资回暖不及预期", "汇率波动"],
        "catalyst": 0.66, "conviction": 0.74, "bias": 0.15,
        "note": "订单拐点确认但评级维持增持，属于右侧验证型推荐，意图积极但保留估值约束。",
    },
    {
        "id": "r11", "analyst": "shen-yanzhou", "stock": "002463", "rating": "增持", "prev": "增持",
        "upside": 0.21, "date": "2026-09-22", "type": "深度研究",
        "title": "AI 服务器 PCB 放量，产品结构持续升级",
        "tags": ["AI 算力", "PCB 升级", "产能扩张"],
        "summary": "AI 服务器高阶 PCB 需求旺盛，公司黄石基地产能利用率维持高位。HDI 产品占比提升带动 ASP 上行，但当前估值已部分反映预期。",
        "points": ["AI 服务器 PCB 收入占比提升至 28%", "HDI 产能年底扩至每月 12 万平方米", "毛利率连续三个季度环比改善"],
        "risks": ["AI 服务器需求不及预期", "原材料价格波动", "产能爬坡不及预期"],
        "catalyst": 0.76, "conviction": 0.76, "bias": 0.10,
        "note": "产业趋势明确但估值已部分兑现，维持增持而非上调至买入，体现一定的估值纪律。",
    },
    {
        "id": "r12", "analyst": "tang-mingchuan", "stock": "600036", "rating": "增持", "prev": "增持",
        "upside": 0.13, "date": "2026-09-25", "type": "行业跟踪",
        "title": "息差企稳，财富管理修复带来估值弹性",
        "tags": ["息差企稳", "财富管理", "高股息"],
        "summary": "三季度净息差环比持平，资产质量保持稳健。财富管理收入在资本市场回暖下修复，公司 ROE 领先同业，估值具备安全边际。",
        "points": ["净息差环比持平于 1.92%", "不良率稳定在 0.93%，拨备覆盖率 412%", "财富管理手续费收入同比增长 11%"],
        "risks": ["息差进一步收窄", "零售不良暴露", "地产风险扩散"],
        "catalyst": 0.50, "conviction": 0.72, "bias": 0.07,
        "note": "低估值与高股息提供安全垫，目标空间 13%，是防御型增持，推票强度中等。",
    },
    {
        "id": "r13", "analyst": "xu-anning", "stock": "600690", "rating": "买入", "prev": "增持",
        "upside": 0.22, "date": "2026-10-09", "type": "深度研究",
        "title": "全球化进入利润释放期，上调盈利预测",
        "tags": ["全球化", "利润释放", "目标价上调"],
        "summary": "海外高端品牌收入增长 24%，北美市场盈利能力持续改善。国内降本增效成果显现，销售费用率同比下降 1.2pct，上调盈利预测与目标价。",
        "points": ["海外收入占比提升至 52%", "北美市场经营利润率突破 7%", "数字化降本带动费用率持续优化"],
        "risks": ["海外需求放缓", "关税政策变化", "原材料涨价"],
        "catalyst": 0.72, "conviction": 0.84, "bias": 0.10,
        "note": "评级上调至买入，全球化利润释放是核心逻辑，目标价空间 22%，意图积极。",
    },
    {
        "id": "r14", "analyst": "gu-qinghe", "stock": "002050", "rating": "买入", "prev": "增持",
        "upside": 0.30, "date": "2026-10-14", "type": "深度研究",
        "title": "机器人执行器打开第二增长曲线",
        "tags": ["机器人", "执行器", "目标价上调"],
        "summary": "公司机电执行器获得头部人形机器人客户定点，2027 年有望进入量产。汽车热管理业务保持稳健，机器人业务提供估值弹性。",
        "points": ["机器人执行器定点落地，单机价值量约 8000 元", "热管理业务全球份额提升至 28%", "墨西哥工厂投产，海外交付能力增强"],
        "risks": ["人形机器人量产进度不及预期", "客户集中度风险", "汽车需求下滑"],
        "catalyst": 0.92, "conviction": 0.80, "bias": 0.12,
        "note": "机器人定点是明确的事件催化，评级上调与目标价上调同步出现，属于强主题推票。",
    },
    {
        "id": "r15", "analyst": "shen-yanzhou", "stock": "300502", "rating": "买入", "prev": "买入",
        "upside": 0.32, "date": "2026-10-16", "type": "业绩预告点评",
        "title": "1.6T 时代开启，业绩预告大超预期",
        "tags": ["1.6T 光模块", "业绩超预期", "AI 算力"],
        "summary": "三季度业绩预告归母净利润同比增长 168%-185%，超出市场预期。1.6T 产品已开始小批量交付，2027 年有望成为主力产品。",
        "points": ["三季度净利润中值 18.6 亿元，环比增长 52%", "1.6T 产品送样进度领先，客户验证顺利", "泰国工厂二期投产，产能瓶颈缓解"],
        "risks": ["客户资本开支下修", "价格竞争加剧", "新产品放量不及预期"],
        "catalyst": 0.96, "conviction": 0.90, "bias": 0.10,
        "note": "业绩预告大幅超预期叠加 1.6T 新品周期，是本期跟踪池中催化强度最高的推荐。",
    },
    {
        "id": "r16", "analyst": "su-nian", "stock": "688235", "rating": "买入", "prev": "增持",
        "upside": 0.26, "date": "2026-10-21", "type": "临床数据点评",
        "title": "泽布替尼放量再加速，海外商业化超预期",
        "tags": ["创新药出海", "商业化超预期", "目标价上调"],
        "summary": "泽布替尼三季度海外销售额同比增长 62%，在多个适应症中保持份额领先。公司实现单季度扭亏，商业化能力得到验证。",
        "points": ["泽布替尼三季度全球销售额 9.8 亿美元", "美国市场处方量环比增长 18%", "单季度经营利润转正，拐点确认"],
        "risks": ["竞争格局恶化", "医保谈判降价", "临床数据不及预期"],
        "catalyst": 0.84, "conviction": 0.82, "bias": 0.09,
        "note": "商业化数据持续超预期，评级上调至买入，属于基本面右侧确认型推荐。",
    },
    {
        "id": "r17", "analyst": "lin-zhiyuan", "stock": "601888", "rating": "中性", "prev": "增持",
        "upside": 0.03, "date": "2026-10-28", "type": "三季报点评",
        "title": "离岛免税承压，等待需求拐点",
        "tags": ["评级下调", "需求承压", "观察"],
        "summary": "三季度离岛免税销售额同比下降 14%，客单价与转化率双双走弱。尽管估值处于历史低位，但需求拐点尚未出现，下调评级至中性。",
        "points": ["离岛免税销售额同比下降 14%", "毛利率环比下降 2.3pct", "机场渠道恢复但仍未弥补离岛缺口"],
        "risks": ["消费复苏不及预期", "出境游分流", "免税政策调整"],
        "catalyst": 0.28, "conviction": 0.48, "bias": -0.09,
        "note": "评级由增持下调至中性，目标价仅剩 3% 空间，明确表达谨慎态度，是跟踪池中的负向样本。",
    },
    {
        "id": "r18", "analyst": "tang-mingchuan", "stock": "600938", "rating": "买入", "prev": "买入",
        "upside": 0.24, "date": "2026-10-30", "type": "三季报点评",
        "title": "低成本优势稳固，高股息价值突出",
        "tags": ["高股息", "低成本", "增储上产"],
        "summary": "桶油成本维持在 28 美元以下，在全球同业中具备显著优势。公司维持高分红政策，当前股息率 6.4%，在油价中枢企稳下具备配置价值。",
        "points": ["桶油主要成本 27.8 美元，同比下降 4%", "前三季度产量同比增长 5.6%", "承诺全年派息率不低于 45%"],
        "risks": ["油价大幅下跌", "地缘政治风险", "资本开支超预期"],
        "catalyst": 0.56, "conviction": 0.80, "bias": 0.06,
        "note": "维持买入主要基于低成本和股息率，目标空间 24%，但短期油价缺乏催化，推票节奏偏防守。",
    },
    {
        "id": "r19", "analyst": "gu-qinghe", "stock": "300274", "rating": "买入", "prev": "增持",
        "upside": 0.28, "date": "2026-11-06", "type": "深度研究",
        "title": "海外储能订单饱满，盈利拐点确立",
        "tags": ["海外储能", "盈利拐点", "目标价上调"],
        "summary": "欧洲与中东大储订单饱满，排产已至 2027 年二季度。逆变器价格企稳，储能系统毛利率环比提升 3.4pct，盈利拐点确立。",
        "points": ["储能在手订单同比增长 58%", "海外收入占比提升至 61%", "储能毛利率环比提升 3.4pct"],
        "risks": ["海外政策变化", "竞争加剧", "汇率波动"],
        "catalyst": 0.86, "conviction": 0.82, "bias": 0.12,
        "note": "订单与毛利率同步改善，评级上调至买入，属于景气拐点型推荐。",
    },
    {
        "id": "r20", "analyst": "xu-anning", "stock": "300124", "rating": "增持", "prev": "增持",
        "upside": 0.19, "date": "2026-11-12", "type": "行业跟踪",
        "title": "工控需求弱复苏，龙头份额继续提升",
        "tags": ["工控复苏", "份额提升", "温和看多"],
        "summary": "10 月工控订单同比转正，新能源车电控业务保持增长。公司凭借平台化能力继续提升份额，但下游资本开支复苏力度仍需观察。",
        "points": ["通用自动化订单同比转正，拐点初现", "新能源汽车电控收入同比增长 23%", "毛利率环比持平，费用控制良好"],
        "risks": ["制造业投资复苏不及预期", "价格竞争", "新业务拓展不及预期"],
        "catalyst": 0.54, "conviction": 0.68, "bias": 0.06,
        "note": "维持增持，更多是份额逻辑而非强催化，目标空间 19%，推票意图温和。",
    },
    {
        "id": "r21", "analyst": "shen-yanzhou", "stock": "002475", "rating": "买入", "prev": "增持",
        "upside": 0.26, "date": "2026-11-18", "type": "事件点评",
        "title": "AI 终端创新周期开启，组装份额有望提升",
        "tags": ["AI 终端", "份额提升", "评级上调"],
        "summary": "头部客户 AI 眼镜与新一代可穿戴产品进入备货期，公司凭借精密制造能力获得主力份额。汽车与通信业务保持双位数增长，上调评级至买入。",
        "points": ["AI 终端新品进入量产备货阶段", "组装份额预计提升 5pct 以上", "汽车连接器收入同比增长 31%"],
        "risks": ["终端销量不及预期", "客户集中度风险", "汇率波动"],
        "catalyst": 0.78, "conviction": 0.78, "bias": -0.02,
        "note": "评级上调至买入，AI 终端创新提供新催化，但报告发布仅 2 个交易日，效果仍待观察。",
    },
]

INDEX_DEFS = [
    ("000300", "沪深300", 4088.0, 1.0, 0.0022),
    ("000001", "上证指数", 3562.0, 0.72, 0.0016),
    ("399001", "深证成指", 11280.0, 1.14, 0.0028),
    ("399006", "创业板指", 2486.0, 1.32, 0.0038),
]


def trading_days(start: date, end: date) -> list[date]:
    days: list[date] = []
    cursor = start
    while cursor <= end:
        if cursor.weekday() < 5:
            days.append(cursor)
        cursor += timedelta(days=1)
    return days


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def intention_score(rating: str, upside: float, catalyst: float, conviction: float) -> float:
    rating_factor = {"买入": 1.0, "增持": 0.82, "中性": 0.25}.get(rating, 0.6)
    upside_factor = clamp(upside / 0.35, 0.0, 1.0)
    return round(32 * rating_factor + 30 * upside_factor + 20 * catalyst + 18 * conviction, 1)


def intention_label(score: float) -> str:
    if score >= 85:
        return "强看多"
    if score >= 72:
        return "积极看多"
    if score >= 58:
        return "审慎看多"
    return "中性观察"


def build_seed(force: bool = False) -> None:
    data_dir = Path(__file__).resolve().parent.parent / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    conn = connect()
    init_schema(conn)

    if not force:
        existing = conn.execute("SELECT COUNT(*) FROM reports").fetchone()[0]
        if existing:
            conn.close()
            return

    conn.execute("DELETE FROM indices")
    conn.execute("DELETE FROM prices")
    conn.execute("DELETE FROM reports")
    conn.execute("DELETE FROM analysts")

    rng = np.random.default_rng(SEED)
    random.seed(SEED)
    dates = trading_days(date(2026, 5, 18), date(2026, 11, 20))
    date_iso = [d.isoformat() for d in dates]

    # A shared market factor with slowly changing regimes.
    regimes = [0.00065, 0.0011, -0.0002, 0.0010, 0.00035, 0.0008, 0.00045]
    market_ret = np.array(
        [regimes[min(int(i / 20), len(regimes) - 1)] + rng.normal(0, 0.0072) for i in range(len(dates))]
    )
    market_ret = np.clip(market_ret, -0.032, 0.032)

    report_by_stock: dict[str, list[dict]] = {}
    for report in REPORTS:
        report_by_stock.setdefault(report["stock"], []).append(report)

    price_rows: list[tuple] = []
    entry_prices: dict[str, float] = {}
    for code, meta in STOCKS.items():
        alpha_daily = np.zeros(len(dates))
        for report in report_by_stock.get(code, []):
            report_idx = date_iso.index(report["date"])
            horizon = 42
            weights = np.array([(horizon - i) ** 0.65 for i in range(horizon)])
            weights = weights / weights.sum()
            for offset in range(horizon):
                idx = report_idx + 1 + offset
                if idx < len(dates):
                    alpha_daily[idx] += report["bias"] * weights[offset]

        noise = rng.normal(0, meta["vol"] * 0.76, len(dates))
        returns = meta["beta"] * market_ret + noise + alpha_daily - 0.5 * (meta["vol"] * 0.76) ** 2
        close = meta["start"]
        for i, day in enumerate(date_iso):
            if i > 0:
                close *= math.exp(returns[i])
            price_rows.append((code, day, round(close, 2)))
            if day in {r["date"] for r in report_by_stock.get(code, [])}:
                entry_prices[f"{code}:{day}"] = round(close, 2)

    conn.executemany("INSERT INTO prices(stock_code, date, close) VALUES (?, ?, ?)", price_rows)

    index_rows: list[tuple] = []
    for code, name, start_value, beta, vol in INDEX_DEFS:
        noise = rng.normal(0, vol, len(dates))
        returns = beta * market_ret + noise - 0.5 * vol**2
        close = start_value
        for i, day in enumerate(date_iso):
            if i > 0:
                close *= math.exp(returns[i])
            index_rows.append((code, name, day, round(close, 2)))
    conn.executemany("INSERT INTO indices(code, name, date, close) VALUES (?, ?, ?, ?)", index_rows)

    for analyst in ANALYSTS:
        conn.execute(
            """INSERT INTO analysts(id, name, firm, title, style, industries, years, avatar, color,
            tagline, bio, style_scores) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                analyst["id"], analyst["name"], analyst["firm"], analyst["title"], analyst["style"],
                json.dumps(analyst["industries"], ensure_ascii=False), analyst["years"], analyst["avatar"],
                analyst["color"], analyst["tagline"], analyst["bio"],
                json.dumps(analyst["style_scores"], ensure_ascii=False),
            ),
        )

    for report in REPORTS:
        entry = entry_prices[f"{report['stock']}:{report['date']}"]
        target = round(entry * (1 + report["upside"]), 2)
        score = intention_score(report["rating"], report["upside"], report["catalyst"], report["conviction"])
        conn.execute(
            """INSERT INTO reports(id, analyst_id, stock_code, stock_name, industry, title, rating,
            prev_rating, target_upside, publish_date, report_type, tags, summary, key_points, risks,
            catalyst_score, conviction_score, intention_score, intention_label, intention_note, alpha_bias,
            target_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                report["id"], report["analyst"], report["stock"], STOCKS[report["stock"]]["name"],
                STOCKS[report["stock"]]["industry"], report["title"], report["rating"], report["prev"],
                report["upside"], report["date"], report["type"],
                json.dumps(report["tags"], ensure_ascii=False),
                report["summary"], json.dumps(report["points"], ensure_ascii=False),
                json.dumps(report["risks"], ensure_ascii=False),
                report["catalyst"], report["conviction"], score, intention_label(score),
                report["note"], report["bias"], target,
            ),
        )

    conn.commit()
    conn.close()
    print(f"Seeded {len(REPORTS)} reports, {len(ANALYSTS)} analysts, {len(STOCKS)} stocks, {len(dates)} trading days.")


if __name__ == "__main__":
    import sys

    if "--demo" not in sys.argv:
        print(
            "Refusing to write demo data into the active database.\n"
            "This command is only for UI demos. Re-run with:\n"
            "  python3 -m backend.seed --demo"
        )
        raise SystemExit(1)
    build_seed(force=True)
