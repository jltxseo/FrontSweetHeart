//app.js
App({
  onLaunch: function (ops) {
    console.log(ops)

    //清空本地数据缓存
    wx.clearStorageSync()
    console.log('clear storeage......')


    //登录验证
    this.logIn(ops)

  },
  logIn: function(ops){
    console.log('loging.......')
    var that = this
    wx.login({
      success: function(e){
        console.log('wx.login successed....')
        var code = e.code
        console.log(code)
        wx.getUserInfo({
          success: function(res){
            console.log('wx.getUserInfo successed.....')
            console.log(res)
            var encryptedData = res.encryptedData
            // 调用服务器api
            that.thirdLogin(code, encryptedData, res.rawData, res.signature,  res.iv, ops)

            // 保存用户信息到全局变量
            that.globalData.userInfo = res.userInfo
            console.log('userInfo:......')
            console.log(that.globalData.userInfo)
          }
        })
      }
    })
  },
  thirdLogin: function(code,encryptedData,rawData,signature,iv,ops){
    var getFulApiData = require("utils/apiData.js").getFulApiData
    var putApiData = require("utils/apiData.js").putApiData
    var that = this
    var data = {}
    data['code'] = code
    data['encryptedData'] = encryptedData
    data['rawData'] = rawData
    data['signature'] = signature
    data['iv'] = iv

    getFulApiData( this.globalData.baseUrl + '/auth/login', data, '', function(res){
      // 获取token并存储到全局变量
      that.globalData.token = res['token']
      that.globalData.userInfo['id'] = res['userId']
      that.globalData.userInfo['is_first'] = res['is_first']
      that.globalData.userInfo['cashbox'] = res['cashbox']
      console.log(that.globalData.userInfo)
    },function(res){
      // 登录成功后获取app的配置
      var getApiData = require("utils/apiData.js").getApiData
      var token = that.globalData.token + ':none'
      var configUri = that.globalData.baseUrl + '/api/v1.0/initConfigs'
      var these = that
      getApiData(configUri, '', token, function(data){
        // 设置配置
        these.globalData.configs = data.configs
        console.log(data)

        // complete是在success完成之后
        if(these.globalData.userInfo['is_first']){
          console.log(these.globalData.configs)
          // https://mp.weixin.qq.com/debug/wxadoc/dev/framework/app-service/scene.html
          // 目前支持单人分享，群分享，加钱
          if(ops.scene == 1007 || ops.scene == 1044){
            var ds = ops.query
            if(ds.hasOwnProperty('userId')){
              var token = these.globalData.token + ':none'
              var userUri = these.globalData.baseUrl + '/api/v1.0/users/' + ds['userId'] + '/addCash'
              var cash = parseFloat(these.globalData.configs['invalid_user_cash'])
              if(these.globalData.userInfo['city'] == 'Zhenjiang'){
                cash = parseFloat(these.globalData.configs['valid_user_cash'])
              }
              putApiData(userUri, {
                'cash': cash
              }, token, function(res){
                console.log('领取券'+ cash +'成功！')
              })
            }
          }
        }
      })

    })
  },
  getUserInfo:function(cb){
    var that = this
    if(this.globalData.userInfo){
      typeof cb == "function" && cb(this.globalData.userInfo)
    }else{
      //调用登录接口
      wx.login({
        success: function (res) {
          console.log(res.code)


          wx.getUserInfo({
            success: function (res) {
              that.globalData.userInfo = res.userInfo
              typeof cb == "function" && cb(that.globalData.userInfo)
            }
          })
        }
      })
    }
  },
  globalData:{
    userInfo: null,
    baseUrl : 'https://flask.haojunyu.com',
    token: null,
    configs: null
  }
})
