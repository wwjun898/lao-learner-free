// 实用词汇 - 做生意/工作场景
export interface VocabItem {
  lao: string;
  chinese: string;
  pinyin: string;    // 便于检索和跟读的拉丁转写
  category: string;
  level: 1 | 2 | 3; // 1=入门 2=进阶 3=高级
}

const coreVocabulary: VocabItem[] = [
  // 数字与货币
  { lao: 'ໜຶ່ງ', chinese: '一', pinyin: 'nueng', category: '数字', level: 1 },
  { lao: 'ສອງ', chinese: '二', pinyin: 'song', category: '数字', level: 1 },
  { lao: 'ສາມ', chinese: '三', pinyin: 'sam', category: '数字', level: 1 },
  { lao: 'ສີ່', chinese: '四', pinyin: 'si', category: '数字', level: 1 },
  { lao: 'ຫ້າ', chinese: '五', pinyin: 'ha', category: '数字', level: 1 },
  { lao: 'ຫົກ', chinese: '六', pinyin: 'hok', category: '数字', level: 1 },
  { lao: 'ເຈັດ', chinese: '七', pinyin: 'jet', category: '数字', level: 1 },
  { lao: 'ແປດ', chinese: '八', pinyin: 'paet', category: '数字', level: 1 },
  { lao: 'ເກົ້າ', chinese: '九', pinyin: 'gao', category: '数字', level: 1 },
  { lao: 'ສິບ', chinese: '十', pinyin: 'sip', category: '数字', level: 1 },
  { lao: 'ຮ້ອຍ', chinese: '百', pinyin: 'hoi', category: '数字', level: 1 },
  { lao: 'ພັນ', chinese: '千', pinyin: 'pan', category: '数字', level: 1 },
  { lao: 'ໝື່ນ', chinese: '万', pinyin: 'muen', category: '数字', level: 2 },
  { lao: 'ແສນ', chinese: '十万', pinyin: 'saen', category: '数字', level: 2 },
  { lao: 'ລ້ານ', chinese: '百万', pinyin: 'lan', category: '数字', level: 2 },
  { lao: 'ກີບ', chinese: '基普(老挝货币)', pinyin: 'kip', category: '货币', level: 1 },
  { lao: 'ບາດ', chinese: '泰铢', pinyin: 'baht', category: '货币', level: 1 },
  { lao: 'ໂດລາ', chinese: '美元', pinyin: 'dola', category: '货币', level: 1 },
  { lao: 'ຢວນ', chinese: '人民币', pinyin: 'yuan', category: '货币', level: 1 },

  // 做生意
  { lao: 'ຊື້', chinese: '买', pinyin: 'sue', category: '做生意', level: 1 },
  { lao: 'ຂາຍ', chinese: '卖', pinyin: 'khai', category: '做生意', level: 1 },
  { lao: 'ລາຄາ', chinese: '价格', pinyin: 'laka', category: '做生意', level: 1 },
  { lao: 'ຖືກ', chinese: '便宜', pinyin: 'thuek', category: '做生意', level: 1 },
  { lao: 'ແພງ', chinese: '贵', pinyin: 'phaeng', category: '做生意', level: 1 },
  { lao: 'ຫຼຸດ', chinese: '打折/减', pinyin: 'lut', category: '做生意', level: 1 },
  { lao: 'ເພີ່ມ', chinese: '加/增加', pinyin: 'phoem', category: '做生意', level: 2 },
  { lao: 'ກຳໄລ', chinese: '利润', pinyin: 'kamai', category: '做生意', level: 2 },
  { lao: 'ຕົ້ນທຶນ', chinese: '成本', pinyin: 'tonthon', category: '做生意', level: 2 },
  { lao: 'ສິນຄ້າ', chinese: '商品/货物', pinyin: 'sinka', category: '做生意', level: 1 },
  { lao: 'ຮ້ານ', chinese: '店/商店', pinyin: 'han', category: '做生意', level: 1 },
  { lao: 'ຕະຫຼາດ', chinese: '市场', pinyin: 'talat', category: '做生意', level: 1 },
  { lao: 'ສັ່ງຊື້', chinese: '订购', pinyin: 'songsue', category: '做生意', level: 2 },
  { lao: 'ຈ່າຍເງິນ', chinese: '付款', pinyin: 'chai ngoen', category: '做生意', level: 1 },
  { lao: 'ເງິນສົດ', chinese: '现金', pinyin: 'ngoen sot', category: '做生意', level: 1 },
  { lao: 'ໂອນເງິນ', chinese: '转账', pinyin: 'on ngoen', category: '做生意', level: 2 },
  { lao: 'ໃບບິນ', chinese: '发票/收据', pinyin: 'bai bin', category: '做生意', level: 2 },

  // 日常交流
  { lao: 'ສະບາຍດີ', chinese: '你好', pinyin: 'sabai dii', category: '日常', level: 1 },
  { lao: 'ຂອບໃຈ', chinese: '谢谢', pinyin: 'khop chai', category: '日常', level: 1 },
  { lao: 'ຂໍໂທດ', chinese: '对不起/不好意思', pinyin: 'kho thot', category: '日常', level: 1 },
  { lao: 'ບໍ່ເປັນຫຍັງ', chinese: '没关系', pinyin: 'bo pen nyang', category: '日常', level: 1 },
  { lao: 'ແມ່ນ', chinese: '是', pinyin: 'maen', category: '日常', level: 1 },
  { lao: 'ບໍ່', chinese: '不/不是', pinyin: 'bo', category: '日常', level: 1 },
  { lao: 'ໄດ້', chinese: '可以/行', pinyin: 'dai', category: '日常', level: 1 },
  { lao: 'ຊ່ວຍແດ່', chinese: '帮帮忙', pinyin: 'suai dae', category: '日常', level: 1 },
  { lao: 'ເທົ່າໃດ', chinese: '多少钱', pinyin: 'thao dai', category: '日常', level: 1 },
  { lao: 'ຢູ່ໃສ', chinese: '在哪里', pinyin: 'yu sai', category: '日常', level: 1 },
  { lao: 'ກິນເຂົ້າ', chinese: '吃饭', pinyin: 'kin khao', category: '日常', level: 1 },
  { lao: 'ນ້ຳ', chinese: '水', pinyin: 'nam', category: '日常', level: 1 },
  { lao: 'ເບີໂທ', chinese: '电话号码', pinyin: 'bo tho', category: '日常', level: 1 },
  { lao: 'ຊື່', chinese: '名字', pinyin: 'sue', category: '日常', level: 1 },
  { lao: 'ຈີນ', chinese: '中国', pinyin: 'jin', category: '日常', level: 1 },
  { lao: 'ຄົນຈີນ', chinese: '中国人', pinyin: 'khon jin', category: '日常', level: 1 },

  // 交通出行
  { lao: 'ລົດ', chinese: '车', pinyin: 'lot', category: '交通', level: 1 },
  { lao: 'ລົດແທັກຊີ', chinese: '出租车', pinyin: 'lot taxi', category: '交通', level: 1 },
  { lao: 'ລົດເມ', chinese: '公交车', pinyin: 'lot me', category: '交通', level: 1 },
  { lao: 'ສະໜາມບິນ', chinese: '机场', pinyin: 'sanam bin', category: '交通', level: 1 },
  { lao: 'ໂຮງແຮມ', chinese: '酒店', pinyin: 'hong haem', category: '交通', level: 1 },
  { lao: 'ທາງ', chinese: '路', pinyin: 'thang', category: '交通', level: 1 },
  { lao: 'ໄກ', chinese: '远', pinyin: 'gai', category: '交通', level: 1 },
  { lao: 'ໃກ້', chinese: '近', pinyin: 'gai', category: '交通', level: 1 },
  { lao: 'ໄປ', chinese: '去', pinyin: 'pai', category: '交通', level: 1 },
  { lao: 'ມາ', chinese: '来', pinyin: 'ma', category: '交通', level: 1 },

  // 餐饮
  { lao: 'ເຂົ້າ', chinese: '米饭', pinyin: 'khao', category: '餐饮', level: 1 },
  { lao: 'ຜັກ', chinese: '蔬菜', pinyin: 'phak', category: '餐饮', level: 1 },
  { lao: 'ເນື້ອ', chinese: '肉', pinyin: 'nua', category: '餐饮', level: 1 },
  { lao: 'ປາ', chinese: '鱼', pinyin: 'pa', category: '餐饮', level: 1 },
  { lao: 'ໄກ່', chinese: '鸡', pinyin: 'gai', category: '餐饮', level: 1 },
  { lao: 'ເຜັດ', chinese: '辣', pinyin: 'phet', category: '餐饮', level: 1 },
  { lao: 'ຫວານ', chinese: '甜', pinyin: 'wan', category: '餐饮', level: 1 },
  { lao: 'ເຄັມ', chinese: '咸', pinyin: 'khem', category: '餐饮', level: 1 },
  { lao: 'ເມນູ', chinese: '菜单', pinyin: 'menu', category: '餐饮', level: 1 },
  { lao: 'ບິນ', chinese: '账单', pinyin: 'bin', category: '餐饮', level: 1 },
];

type VocabSeed = readonly [
  lao: string,
  chinese: string,
  pinyin: string,
  level: VocabItem['level'],
];

const themedVocabulary: Record<string, readonly VocabSeed[]> = {
  方位: [
    ['ຊ້າຍ', '左边', 'sai', 1],
    ['ຂວາ', '右边', 'khua', 1],
    ['ທາງໜ້າ', '前面', 'thang na', 1],
    ['ທາງຫຼັງ', '后面', 'thang lang', 1],
    ['ຂ້າງເທິງ', '上面', 'khang thoeng', 1],
    ['ຂ້າງລຸ່ມ', '下面', 'khang lum', 1],
    ['ຂ້າງໃນ', '里面', 'khang nai', 1],
    ['ຂ້າງນອກ', '外面', 'khang nok', 1],
  ],
  职业: [
    ['ຄູ', '教师', 'khu', 1],
    ['ທ່ານໝໍ', '医生', 'than mo', 1],
    ['ພະຍາບານ', '护士', 'phayaban', 1],
    ['ວິສະວະກອນ', '工程师', 'wisawakon', 2],
    ['ຄົນຂັບລົດ', '司机', 'khon khap lot', 1],
    ['ນັກທຸລະກິດ', '商人', 'nak thulakit', 2],
    ['ພະນັກງານ', '职员', 'phanak ngan', 1],
    ['ຊາວນາ', '农民', 'sao na', 1],
  ],
  家庭: [
    ['ຄອບຄົວ', '家庭', 'khop khua', 1],
    ['ພໍ່', '父亲', 'pho', 1],
    ['ແມ່', '母亲', 'mae', 1],
    ['ອ້າຍ', '哥哥', 'ai', 1],
    ['ເອື້ອຍ', '姐姐', 'ueay', 1],
    ['ນ້ອງ', '弟弟/妹妹', 'nong', 1],
    ['ຜົວ', '丈夫', 'phua', 1],
    ['ເມຍ', '妻子', 'mia', 1],
  ],
  形状: [
    ['ຮູບຮ່າງ', '形状', 'hup hang', 1],
    ['ວົງມົນ', '圆形', 'wong mon', 1],
    ['ສີ່ຫຼ່ຽມ', '正方形/四边形', 'si liam', 1],
    ['ສາມຫຼ່ຽມ', '三角形', 'sam liam', 1],
    ['ສີ່ຫຼ່ຽມຜືນຜ້າ', '长方形', 'si liam phuen pha', 2],
    ['ມົນ', '圆的', 'mon', 1],
    ['ເສັ້ນຊື່', '直线', 'sen sue', 1],
    ['ໂຄ້ງ', '弯曲的', 'khong', 1],
  ],
  颜色: [
    ['ສີ', '颜色', 'si', 1],
    ['ສີແດງ', '红色', 'si daeng', 1],
    ['ສີຟ້າ', '蓝色', 'si fa', 1],
    ['ສີຂຽວ', '绿色', 'si khiao', 1],
    ['ສີເຫຼືອງ', '黄色', 'si lueang', 1],
    ['ສີຂາວ', '白色', 'si khao', 1],
    ['ສີດຳ', '黑色', 'si dam', 1],
    ['ສີນ້ຳຕານ', '棕色', 'si nam tan', 1],
  ],
  服饰: [
    ['ເສື້ອຜ້າ', '服装', 'suea pha', 1],
    ['ເສື້ອ', '上衣', 'suea', 1],
    ['ໂສ້ງ', '裤子', 'song', 1],
    ['ສິ້ນ', '老挝筒裙', 'sin', 1],
    ['ຊຸດກະໂປງ', '连衣裙', 'sut kapong', 2],
    ['ເກີບ', '鞋', 'koep', 1],
    ['ໝວກ', '帽子', 'muak', 1],
    ['ກະເປົາ', '包', 'kapao', 1],
  ],
  日期: [
    ['ວັນທີ', '日期', 'wan thi', 1],
    ['ມື້ນີ້', '今天', 'mue ni', 1],
    ['ມື້ອື່ນ', '明天', 'mue uen', 1],
    ['ມື້ວານ', '昨天', 'mue wan', 1],
    ['ອາທິດ', '星期/周', 'athit', 1],
    ['ເດືອນ', '月', 'duean', 1],
    ['ປີ', '年', 'pi', 1],
    ['ທ້າຍອາທິດ', '周末', 'thai athit', 2],
  ],
  时间: [
    ['ເວລາ', '时间', 'wela', 1],
    ['ໂມງ', '点钟/小时', 'mong', 1],
    ['ນາທີ', '分钟', 'nathi', 1],
    ['ຕອນເຊົ້າ', '早晨', 'ton sao', 1],
    ['ຕອນທ່ຽງ', '中午', 'ton thiang', 1],
    ['ຕອນບ່າຍ', '下午', 'ton bai', 1],
    ['ຕອນແລງ', '傍晚', 'ton laeng', 1],
    ['ຕອນກາງຄືນ', '夜晚', 'ton kang khuen', 1],
  ],
  旅行: [
    ['ທ່ອງທ່ຽວ', '旅行/旅游', 'thong thiao', 1],
    ['ໜັງສືຜ່ານແດນ', '护照', 'nangsue phan daen', 1],
    ['ວີຊາ', '签证', 'visa', 1],
    ['ປີ້', '票', 'pi', 1],
    ['ກະເປົາເດີນທາງ', '行李箱', 'kapao doen thang', 1],
    ['ນັກທ່ອງທ່ຽວ', '游客', 'nak thong thiao', 1],
    ['ຜູ້ນຳທ່ຽວ', '导游', 'phu nam thiao', 2],
    ['ແຜນທີ່', '地图', 'phaen thi', 1],
  ],
  音乐: [
    ['ດົນຕີ', '音乐', 'dontri', 1],
    ['ເພງ', '歌曲', 'pheng', 1],
    ['ຮ້ອງເພງ', '唱歌', 'hong pheng', 1],
    ['ເຕັ້ນ', '跳舞', 'ten', 1],
    ['ນັກດົນຕີ', '音乐家', 'nak dontri', 2],
    ['ກີຕ້າ', '吉他', 'kita', 1],
    ['ກອງ', '鼓', 'kong', 1],
    ['ຟັງເພງ', '听音乐', 'fang pheng', 1],
  ],
  银行: [
    ['ທະນາຄານ', '银行', 'thanakhan', 1],
    ['ບັນຊີ', '账户', 'bansi', 1],
    ['ຝາກເງິນ', '存款', 'fak ngoen', 1],
    ['ຖອນເງິນ', '取款', 'thon ngoen', 1],
    ['ແລກເງິນ', '兑换货币', 'laek ngoen', 1],
    ['ດອກເບ້ຍ', '利息', 'dok bia', 2],
    ['ເງິນກູ້', '贷款', 'ngoen ku', 2],
    ['ຕູ້ເອທີເອັມ', '自动取款机', 'tu ATM', 1],
  ],
  住所: [
    ['ເຮືອນ', '房屋/家', 'huean', 1],
    ['ທີ່ຢູ່', '地址', 'thi yu', 1],
    ['ຫ້ອງ', '房间', 'hong', 1],
    ['ຫ້ອງນອນ', '卧室', 'hong non', 1],
    ['ຫ້ອງນ້ຳ', '卫生间', 'hong nam', 1],
    ['ເຮືອນຄົວ', '厨房', 'huean khua', 1],
    ['ເຊົ່າ', '租赁', 'sao', 1],
    ['ອາພາດເມັນ', '公寓', 'aphatmen', 2],
  ],
  看病: [
    ['ໂຮງໝໍ', '医院', 'hong mo', 1],
    ['ຄົນເຈັບ', '病人', 'khon jep', 1],
    ['ເຈັບ', '生病/疼痛', 'jep', 1],
    ['ໄຂ້', '发烧', 'khai', 1],
    ['ເຈັບຫົວ', '头疼', 'jep hua', 1],
    ['ເຈັບທ້ອງ', '肚子疼', 'jep thong', 1],
    ['ຢາ', '药', 'ya', 1],
    ['ຮ້ານຂາຍຢາ', '药店', 'han khai ya', 1],
  ],
  人际关系: [
    ['ໝູ່', '朋友', 'mu', 1],
    ['ເພື່ອນຮ່ວມງານ', '同事', 'phuean huam ngan', 1],
    ['ເພື່ອນບ້ານ', '邻居', 'phuean ban', 1],
    ['ລູກຄ້າ', '客户', 'luk kha', 1],
    ['ຄູ່ຮ່ວມງານ', '合作伙伴', 'khu huam ngan', 2],
    ['ເຈົ້ານາຍ', '上司', 'chao nai', 1],
    ['ແຂກ', '客人', 'khaek', 1],
    ['ຄວາມສຳພັນ', '关系', 'khwam samphan', 2],
  ],
  天气: [
    ['ອາກາດ', '天气', 'akat', 1],
    ['ຮ້ອນ', '炎热', 'hon', 1],
    ['ໜາວ', '寒冷', 'nao', 1],
    ['ຝົນ', '雨', 'fon', 1],
    ['ລົມ', '风', 'lom', 1],
    ['ແດດ', '阳光/晴天', 'daet', 1],
    ['ເມກ', '云', 'mek', 1],
    ['ພາຍຸ', '暴风雨', 'phayu', 2],
  ],
  理由: [
    ['ເຫດຜົນ', '理由', 'het phon', 1],
    ['ເພາະວ່າ', '因为', 'pho wa', 1],
    ['ດັ່ງນັ້ນ', '所以/因此', 'dang nan', 1],
    ['ເປັນຫຍັງ', '为什么', 'pen nyang', 1],
    ['ສຳຄັນ', '重要', 'samkhan', 1],
    ['ຈຳເປັນ', '必要', 'champen', 1],
    ['ບັນຫາ', '问题', 'banha', 1],
    ['ວິທີແກ້ໄຂ', '解决办法', 'withi kae khai', 2],
  ],
  社交: [
    ['ພົບກັນ', '见面', 'phop kan', 1],
    ['ເຊີນ', '邀请', 'soen', 1],
    ['ງານລ້ຽງ', '聚会/宴会', 'ngan liang', 1],
    ['ລົມກັນ', '聊天', 'lom kan', 1],
    ['ແນະນຳຕົວ', '自我介绍', 'nae nam tua', 1],
    ['ຕິດຕໍ່', '联系', 'tit to', 1],
    ['ໂທຫາ', '打电话给', 'tho ha', 1],
    ['ຂໍ້ຄວາມ', '消息/短信', 'kho khwam', 1],
  ],
  会议: [
    ['ກອງປະຊຸມ', '会议', 'kong pachum', 1],
    ['ວາລະກອງປະຊຸມ', '会议议程', 'wala kong pachum', 2],
    ['ຜູ້ເຂົ້າຮ່ວມ', '参会者', 'phu khao huam', 2],
    ['ນຳສະເໜີ', '介绍/展示', 'nam sanoe', 1],
    ['ປຶກສາຫາລື', '讨论', 'pueksa halu', 2],
    ['ເຫັນດີ', '同意', 'hen di', 1],
    ['ບົດບັນທຶກ', '会议记录', 'bot banthuek', 2],
    ['ສະຫຼຸບ', '总结', 'salup', 1],
  ],
  商业: [
    ['ບໍລິສັດ', '公司', 'bolisat', 1],
    ['ສັນຍາ', '合同', 'sanya', 1],
    ['ການລົງທຶນ', '投资', 'kan long thuen', 2],
    ['ທຸລະກິດ', '商业/生意', 'thulakit', 1],
    ['ຜູ້ສະໜອງ', '供应商', 'phu sanong', 2],
    ['ຍອດຂາຍ', '销售额', 'yot khai', 2],
    ['ງົບປະມານ', '预算', 'ngop paman', 2],
    ['ໂຄງການ', '项目', 'khongkan', 1],
  ],
  景观: [
    ['ທິວທັດ', '景观/风景', 'thiu that', 1],
    ['ພູ', '山', 'phu', 1],
    ['ແມ່ນ້ຳ', '河流', 'mae nam', 1],
    ['ນ້ຳຕົກ', '瀑布', 'nam tok', 1],
    ['ປ່າ', '森林', 'pa', 1],
    ['ໜອງນ້ຳ', '湖泊/池塘', 'nong nam', 1],
    ['ວັດ', '寺庙', 'wat', 1],
    ['ຂົວ', '桥', 'khua', 1],
  ],
};

export const categories = [
  '数字', '货币', '时间', '日期', '大小', '重量', '长度', '形状', '颜色', '状态',
  '方位', '风景', '家庭', '职业', '身体部位', '看病健康', '人际关系', '社交礼貌',
  '喜怒哀乐', '同意反对', '担心满意', '动物植物', '地名属地', '常用名词',
  '常用动词', '常用副词', '常用形容词', '常用介词连词',
] as const;

const supplementalVocabulary: Record<string, readonly VocabSeed[]> = {
  大小: [
    ['ຂະໜາດ', '尺寸/大小', 'khanat', 1], ['ໃຫຍ່', '大', 'yai', 1],
    ['ນ້ອຍ', '小', 'noi', 1], ['ສູງ', '高', 'sung', 1], ['ຕ່ຳ', '低', 'tam', 1],
  ],
  重量: [
    ['ນ້ຳໜັກ', '重量', 'nam nak', 1], ['ໜັກ', '重', 'nak', 1],
    ['ເບົາ', '轻', 'bao', 1], ['ກິໂລກຣາມ', '公斤', 'kilokram', 1], ['ກຣາມ', '克', 'kram', 1],
  ],
  长度: [
    ['ຄວາມຍາວ', '长度', 'khwam yao', 1], ['ຍາວ', '长', 'yao', 1],
    ['ສັ້ນ', '短', 'san', 1], ['ແມັດ', '米', 'maet', 1], ['ຊັງຕີແມັດ', '厘米', 'sangti maet', 1],
  ],
  常用形容词: [
    ['ດີ', '好', 'di', 1], ['ບໍ່ດີ', '不好', 'bo di', 1], ['ງາມ', '漂亮', 'ngam', 1],
    ['ໃໝ່', '新的', 'mai', 1], ['ເກົ່າ', '旧的', 'kao', 1],
  ],
  常用副词: [
    ['ຫຼາຍ', '很/很多', 'lai', 1], ['ອີກ', '又/再', 'ik', 1], ['ສະເໝີ', '总是', 'samo', 2],
    ['ຊ້າໆ', '慢慢地', 'sa sa', 1], ['ໄວ', '快地', 'wai', 1],
  ],
  常用介词连词: [
    ['ແລະ', '和/并且', 'lae', 1], ['ຫຼື', '或者', 'lue', 1], ['ກັບ', '和/与/跟', 'kap', 1],
    ['ແຕ່', '但是', 'tae', 1], ['ເພາະວ່າ', '因为', 'pho wa', 1], ['ດັ່ງນັ້ນ', '所以', 'dang nan', 1],
  ],
  地名属地: [
    ['ປະເທດລາວ', '老挝', 'pathet lao', 1], ['ປະເທດຈີນ', '中国', 'pathet chin', 1],
    ['ວຽງຈັນ', '万象', 'wiang chan', 1], ['ຫຼວງພະບາງ', '琅勃拉邦', 'luang phabang', 1],
    ['ແຂວງ', '省', 'khuang', 1], ['ເມືອງ', '城市/县', 'mueang', 1],
  ],
  动物植物: [
    ['ໝາ', '狗', 'ma', 1], ['ແມວ', '猫', 'maeo', 1], ['ນົກ', '鸟', 'nok', 1],
    ['ຕົ້ນໄມ້', '树', 'ton mai', 1], ['ດອກໄມ້', '花', 'dok mai', 1],
  ],
  状态: [
    ['ໄມ້', '木材', 'mai', 1], ['ເຫຼັກ', '铁/金属', 'lek', 1], ['ພລາສຕິກ', '塑料', 'phlasatik', 1],
    ['ແກ້ວ', '玻璃', 'kaeo', 1], ['ຜ້າ', '布料', 'pha', 1],
  ],
  身体部位: [
    ['ຫົວ', '头', 'hua', 1], ['ຕາ', '眼睛', 'ta', 1], ['ຫູ', '耳朵', 'hu', 1],
    ['ປາກ', '嘴', 'pak', 1], ['ມື', '手', 'mue', 1], ['ຕີນ', '脚', 'tin', 1],
  ],
  喜怒哀乐: [
    ['ດີໃຈ', '高兴', 'di chai', 1], ['ເສຍໃຈ', '难过', 'sia chai', 1],
    ['ໃຈຮ້າຍ', '生气', 'chai hai', 1], ['ຢ້ານ', '害怕', 'yan', 1], ['ຕື່ນເຕັ້ນ', '兴奋', 'tuen ten', 1],
  ],
  同意反对: [
    ['ເຫັນດີ', '同意', 'hen di', 1], ['ບໍ່ເຫັນດີ', '不同意', 'bo hen di', 1],
    ['ຕົກລົງ', '同意/说定', 'tok long', 1], ['ຄັດຄ້ານ', '反对', 'khat khan', 2],
  ],
  担心满意: [
    ['ກັງວົນ', '担心', 'kang won', 1], ['ພໍໃຈ', '满意', 'pho chai', 1],
    ['ບໍ່ພໍໃຈ', '不满意', 'bo pho chai', 1], ['ໝັ້ນໃຈ', '有信心', 'man chai', 1], ['ຜິດຫວັງ', '失望', 'phit wang', 2],
  ],
  常用名词: [
    ['ສິ່ງຂອງ', '东西/物品', 'sing khong', 1], ['ຊື່', '名字', 'sue', 1],
    ['ຄຳ', '词/话语', 'kham', 1], ['ພາສາ', '语言', 'phasa', 1],
    ['ບັນຫາ', '问题', 'banha', 1], ['ວຽກ', '工作', 'wiak', 1],
    ['ສະຖານທີ່', '地点/场所', 'sathan thi', 1], ['ເລື່ອງ', '事情/故事', 'lueang', 1],
  ],
};

const fixedCategoryByLegacy: Record<string, string> = {
  看病: '看病健康', 景观: '风景', 社交: '社交礼貌', 交通: '常用名词', 旅行: '常用名词',
  住所: '常用名词', 服饰: '常用名词', 音乐: '常用名词', 天气: '风景', 理由: '常用介词连词',
  银行: '货币', 商业: '常用名词', 会议: '常用名词', 做生意: '常用名词', 日常: '社交礼貌',
  餐饮: '常用名词', 动词: '常用动词', 副词: '常用副词', 形容词: '常用形容词',
  介词连词: '常用介词连词', 材质状态: '状态',
};

export function normalizeVocabularyCategory(category: string, chinese = ''): string {
  if ((categories as readonly string[]).includes(category)) return category;
  if (/买|卖|付款|转账|订购|吃|去|来|租|唱|跳|听|联系|讨论|介绍|总结|投资/.test(chinese)) return '常用动词';
  if (/便宜|贵|远|近|辣|甜|咸|热|冷|重要|必要/.test(chinese)) return '常用形容词';
  if (/朋友|同事|客户|伙伴|上司|客人|名字|人/.test(chinese)) return '人际关系';
  if (/谢谢|对不起|你好|请|不客气|帮助/.test(chinese)) return '社交礼貌';
  return fixedCategoryByLegacy[category] ?? '常用名词';
}

const originalVocabulary: VocabItem[] = [
  ...coreVocabulary,
  ...Object.entries(themedVocabulary).flatMap(([category, items]) =>
    items.map(([lao, chinese, pinyin, level]) => ({ lao, chinese, pinyin, category, level })),
  ),
];

const additions = Object.entries(supplementalVocabulary).flatMap(([category, items]) =>
  items.map(([lao, chinese, pinyin, level]) => ({ lao, chinese, pinyin, category, level })),
);

export const vocabulary: VocabItem[] = [...originalVocabulary, ...additions]
  .map(item => ({ ...item, category: normalizeVocabularyCategory(item.category, item.chinese) }))
  .filter((item, index, all) => all.findIndex(candidate => candidate.lao === item.lao) === index)
  .sort((left, right) => categories.indexOf(left.category as typeof categories[number]) - categories.indexOf(right.category as typeof categories[number]));
