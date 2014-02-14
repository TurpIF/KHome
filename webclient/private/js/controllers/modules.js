function ModulesCtrl($scope, $location, ModuleService) {
  // Reload modules immediately
  $scope.reloadModules();

  // Uninstall a module
  $scope.uninstall = function(module) {
    console.log('uninstalling', module);
  };

  // Navigate to module view, either its specific view or configuration
  $scope.navigate = function(module) {
    $location.path('/modules/' + module.id);
  };
}
