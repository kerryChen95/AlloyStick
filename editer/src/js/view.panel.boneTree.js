/**
骨骼数面板的view
@module
**/
define([
    'jquery',
    'view.Panel'
], function(
    $,
    PanelView
){
    var BoneTreePanelView;

    /**
    @class BoneTreePanelView
    @extends PanelView
    **/
    BoneTreePanelView = PanelView.extend({
        /**
        Start: backbone内置属性/方法
        **/
        el: $('#js-boneTreePanel'),
        initialize: function(){
            // 复用父类的`initialize`方法
            this.constructor.__super__.initialize.apply(this, arguments);
        },
        /**
        渲染此面板
        @method render
        @param {Array} [bonesData] 多个骨骼的当前数据
        **/
        render: function(bonesData){
            this.$el
                .html( this.panelTmpl({
                    type: 'boneTree',
                    title: '骨骼树'
                }) );

            // 如果有传入骨骼数据，渲染出骨骼view
            if(bonesData){
                bonesData.forEach(function(boneData){
                    this.addBone(boneData);
                }, this);
            }

            return this;
        },
        /**
        End: backbone内置属性/方法
        **/

        /**
        添加一个骨骼view到骨骼树中，遵循父子关系
        @method addBone
        @param {Object} data 骨骼的数据
        **/
        addBone: function(data){
            return this;
        }
    });

    return new BoneTreePanelView();
});
