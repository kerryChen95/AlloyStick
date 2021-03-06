/**
抽象视图，不应用于实例化，而是抽象出共有的部分，以给别的类来继承。
此抽象类是工作区视图类、骨骼树视图类的公共抽象，
这两个视图类都需要实现、维护骨骼树的结构
@module
@exports 抽象的骨骼框架视图的类
**/
define([
    'view.panel', 'view.abstractBone'
], function(Panel, AbstractBone){
    var AbstractSkeleton;

    AbstractSkeleton = Panel.extend({
        initialize: function(){
            // 复用父类的initialize方法
            AbstractSkeleton.__super__.initialize.apply(this, arguments);

            // 此面板中所有骨骼view构成的hash，用骨骼的id索引
            this._boneHash = {};

            // 当前被激活的骨骼
            // **只要有骨骼，总有一个骨骼处于激活状态**
            this._activeBone = null;

            // 这个骨骼框架中的骨骼的构造函数
            // **子类要使用继承自 `AbstractBone` 的类覆盖此属性**
            this._Bone = AbstractBone;

            // 骨骼的默认DOM容器，
            // 如果没有指定父骨骼，也没有激活骨骼，这添加到此容器中
            // **子类要覆盖此属性**
            this._boneDefaultContainer = this.el;
        },

        /* Start: 对本面板中的骨骼的增删改 */

        /**
        使用所提供的骨骼数据，给此面板创建并添加一个骨骼。
        如果所提供的骨骼数据中有指定父骨骼，使用指定的父骨骼；
        如果所提供的骨骼数据中没有指定父骨骼，使用激活骨骼作为父骨骼；
        如果没有激活骨骼（即还没有任何骨骼），添加此骨骼为根骨骼并激活之；
        如果所提供的骨骼数据中带有子骨骼的数据，递归添加子骨骼。
        @param {Object} boneData 要添加的骨骼的数据
        @param {Object} [options]
        @return {this._Bone} 新创建的骨骼实例
        **/
        addBone: function(boneData, options){
            var parent, bone, childrenData;

            console.debug(
                'Panel %s start adding bone %s',
                this.panelName, boneData.id
            );
            if(parent = boneData.parent){
                bone = this._addBone(
                    boneData,
                    this._boneHash[parent],
                    options
                );
            }
            else if(this._activeBone){
                bone = this._addBone(boneData, this._activeBone, options);
            }
            else{
                bone = this._addBone(boneData, options);
                this.changeActiveBone(bone.id);
            }

            console.debug(
                'Panel %s end adding bone %s',
                this.panelName, boneData.id
            );
            return bone;
        },

        /**
        将指定的骨骼从此骨架中删除。
        @param {String} id 骨骼的id
        @param {Object} [options]
        @return this
        **/
        removeBone: function(id, options){
            var bone = this._boneHash[id],
                parent, siblings;

            if(!bone){
                console.warn(
                    'Panel %s remove bone %s that does not exist in this panel',
                    this.panel, id
                );
            }

            // 删除指定的骨骼及其子骨骼
            bone.remove();

            // 删除指定骨骼在其父骨骼中的引用
            if( (parent = bone.parent) ){
                siblings = parent.children;
                siblings.splice(siblings.indexOf(bone), 1);
            }

            // 删除此骨架对指定骨骼的引用
            delete this._boneHash[id];

            return this;
        },

        /**
        更新此面板中的某个骨骼
        @param {String} id 骨骼的id
        @param {Object} data 要更新的数据
        @param {Object} [options]
        @return this
        **/
        updateBone: function(id, data, options){
            var bone, siblings;

            // 更新父子骨骼view的引用关系
            if(data.parent){
                bone = this._boneHash[id];
                // 删除在父骨骼中的引用
                siblings = bone.parent.children;
                siblings.splice(siblings.indexOf(bone), 1);
                // 引用新的父骨骼
                bone.parent = this._boneHash[data.parent];
                // 将自身引用插入到新的父骨骼中
                // TODO: 先始终插入为第一个子骨骼，后续支持指定插入为第几个子骨骼
                bone.parent.children.unshift(bone);
            }

            this._boneHash[id].update(data, options);

            console.debug(
                'Panel %s updated bone %s to %O',
                this.panelName, id, data
            );

            return this;
        },

        /**
        改变此面板中的激活骨骼，
        并且如果改变产生，触发 `changedActiveBone` 事件，带上激活骨骼的id作为参数。
        只要有骨骼，就有骨骼处于激活状态，并且只有一个激活骨骼。
        @param {String} boneId 要激活的骨骼的id
        @param {Object} [options]
            @param {Boolean} [options.silent=false] 不触发事件
        @return {Boolean} true: 有改变；false: 没改变
        **/
        changeActiveBone: function(boneId, options){
            var oldActiveBone = this._activeBone;

            options = options || {};

            if(oldActiveBone){
                if(oldActiveBone.id === boneId) return false;
                oldActiveBone.deactivate();
            }
            if( this._activeBone = this._boneHash[boneId] ){
                this._activeBone.activate();
            }
            else{
                console.warn(
                    'Panel %s activate bone %s which is nonexistent in this panel',
                    this.panelName,
                    boneId
                );
                return;
            }

            if(!options.silent){
                this.trigger('changedActiveBone', boneId);
            }

            return true;
        },

        /* End: 对本面板中的骨骼的增删改 */


        /* Start: 私有成员 */

        /**
        使用提供的骨骼数据创建骨骼，并添加为指定父骨骼的子骨骼。
        如果有子骨骼的数据，递归添加子骨骼
        @param {Object} boneData 要添加的骨骼的数据
        @param {this._Bone} [parentBone] 要添加为哪个骨骼的子骨骼
        @param {Object} [options]
        @return {this._Bone} 所创建的骨骼
        **/
        _addBone: function(boneData, parentBone, options){
            var bone, childrenData;

            if(!parentBone){
                options = parentBone;
                parentBone = undefined;

                (bone = this._boneHash[boneData.id] = new this._Bone())
                    .render(boneData, this._boneDefaultContainer, options);
            }
            else{
                bone
                    = this._boneHash[boneData.id]
                    = parentBone.addChild(boneData, options);
            }

            if( (childrenData = boneData.children) && childrenData.length ){
                childrenData.forEach(function(childData){
                    this._addBone(childData, bone);
                }, this);
            }
            return bone;
        }

        /* End: 私有成员 */
    });

    return AbstractSkeleton;    
});
