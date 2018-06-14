/**
 * @file: diviEntryWithDate
 *
 * @author: suweirong(suweirong@baidu.com)
 *
 * @date: 2016-11-22 05:50:34
 *
 * @description:
 *
 * 这个文件定义了按时间将会话入口进行分组的方法；cccccddd
 * 包括 groups，topics，groupTopics 三个列表的根据时间分组都是使用此文件
 */
import {
    isLastDay,
    isToday,
    formatOneDay
} from './dateFormat.min.js';


/**
 * @method getOrderTime
 *
 * @param {Object} entry 需要被处理的会话入口
 *
 * @description: 
 *  根据不同的入口类型(inbox, groups, topics, groupTopics), 选择不同的时间作为分组依据
 */
let getOrderTime = entry => {
    // 先根据 msgStatus 返回
    if (entry.msgStatus) {
        return entry.msgStatus.lastActiveTime
    }
    // groupTopics 类型
    else if (entry.topicInfo) {
        return entry.topicInfo.lastUpdateTime || entry.topicInfo.createTime;
    }

    return entry.msgStatus.lastActiveTime
};


/**
 * @method formatList
 *
 * @param {Array} groupList 需要处理的入口列表
 *
 * @param {String} listType 列表的类型，一个标志用来做时间或者其他数据的差异化处理
 *
 * @param {bool} withSetTop 是否考虑置顶的归类，为true时会新建一个
 *
 * @return {Object}
 *
 * @description:
 *  按照会话时间将会话入口进行分组
 */
let formatList = (groupList, withSetTop = false) => {
    // 根据时间分组群列表
    var renderList = {
        'time_1970_0_1': {
            list: [],
            title: '更早'
        }
    };
    var time;
    var key = '';
    var groupDate;
    var groupYear;
    var groupMonth;
    var keys = [];

    // 将 groupList 中的单元进行分组
    groupList.forEach((el, i) => {
        // 考虑存在置顶的模式情况
        if (withSetTop && el.setTop === true) {
            key = 'time_2970_0_0';
            // key 为 time_2970_0_0 是为了在后面的排序过程置顶能排在第一位
            if (!renderList[key]) {
                renderList[key] = {
                    list: [el],
                    title: '置顶'
                }
            } else {
                renderList[key].list.push(el);
            }

            return 1;
        }

        /*
         * 这段代码很难维护啊，得改
         */
        // 非置顶情况
        // 群会话右侧群话题列表满足 el.topicInfo 不为空
        // 左侧群列表满足 el.topicInfo && !el.groupInfo
        if (el.msgStatus || (el.topicInfo && !el.groupInfo)) {
            time = new Date(parseInt(getOrderTime(el)));
            groupDate = time.getDate();
            groupYear = time.getFullYear();
            groupMonth = time.getMonth();
            key = 'time_' + groupYear + '_' + groupMonth + '_' + groupDate;

            if (!groupYear) return;

            if (!renderList[key]) {
                renderList[key] = {
                    list: [el]
                }
                renderList[key].title = formatOneDay(groupYear, groupMonth, groupDate);
            } else {
                renderList[key].list.push(el);
            }
        } else {
            // 默认放入更早的组
            renderList['time_1970_0_1'].list.push(el);
        }
    });

    // 重排渲染顺序
    keys = Object.keys(renderList).sort(function(pre, next) {
        if (pre < next) {
            return 1;
        } else if (pre > next) {
            return -1;
        }
        return 0;
    });

    // 最新消息在同一天的群使用群名称进行正序排序
    keys.forEach((key) => {
        renderList[key].list.sort((pre, next) => {
            if (pre.name < next.name) {
                return -1;
            } else if (pre.name > next.name) {
                return 1
            }
            return 0;
        });
    })

    return {
        renderList,
        keys
    };
};

export {
    formatList
}